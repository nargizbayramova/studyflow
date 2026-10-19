import json
from datetime import UTC, date, datetime, time, timedelta, tzinfo
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DbSession, Paging
from app.models import AvailabilitySlot, BlockStatus, Course, SlotKind, StudyBlock, Task, TaskStatus
from app.schemas.schedule import AIGeneratedSchedule, ScheduleResponse, StudyBlockOut
from app.services.ai_client import generate_structured

router = APIRouter(prefix="/schedule", tags=["Schedule"])

SYSTEM_PROMPT = (
    "You are an academic study scheduler. "
    "Distribute task remaining_effort_hours across the provided concrete_available_windows prior to each task's due_date. "
    "CRITICAL CONSTRAINTS: "
    "1. You MUST schedule study blocks ONLY inside the provided concrete_available_windows. "
    "2. Every study block's date, start_time, and end_time MUST fit completely inside an available window on that date. "
    "3. NEVER invent dates or times outside of concrete_available_windows. Do NOT overlap sessions. "
    "4. Prioritize tasks with closer deadlines and higher syllabus_weight. "
    "5. Keep every session between 45 and 120 minutes (HH:MM 24-hour format, end_time > start_time) with an actionable focus_goal. "
    "6. If total required hours exceed available windows before deadlines, schedule as much as fits and set overload_warning=true."
)


def _subtract_intervals(
    avail: tuple[time, time], blocked: list[tuple[time, time]]
) -> list[tuple[time, time]]:
    """Subtracts blocked time windows from an available time window."""
    def to_min(t: time) -> int:
        return t.hour * 60 + t.minute

    def to_time(m: int) -> time:
        return time(m // 60, m % 60)

    cur_intervals = [[to_min(avail[0]), to_min(avail[1])]]
    for bs_t, be_t in blocked:
        bs, be = to_min(bs_t), to_min(be_t)
        next_intervals: list[list[int]] = []
        for s, e in cur_intervals:
            if be <= s or bs >= e:
                next_intervals.append([s, e])
            else:
                if s < bs:
                    next_intervals.append([s, bs])
                if be < e:
                    next_intervals.append([be, e])
        cur_intervals = next_intervals

    # Retain windows of at least 30 minutes
    return [(to_time(s), to_time(e)) for s, e in cur_intervals if e - s >= 30]


def _resolve_tz(tz: str) -> tzinfo:
    # Availability slots are wall-clock times in the user's zone, not UTC.
    try:
        return ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown timezone: {tz}") from exc


def _parse_block_datetimes(
    date_str: str, start_str: str, end_str: str, tz: tzinfo
) -> tuple[datetime, datetime] | None:
    try:
        d = date.fromisoformat(date_str[:10])
        st = time.fromisoformat(start_str[:5])
        et = time.fromisoformat(end_str[:5])
        start_dt = datetime.combine(d, st, tzinfo=tz)
        end_dt = datetime.combine(d, et, tzinfo=tz)
        return (start_dt, end_dt) if end_dt > start_dt else None
    except ValueError:
        return None


def _to_study_block_out(block: StudyBlock, task: Task, focus_goal: str = "") -> StudyBlockOut:
    course = task.course
    return StudyBlockOut(
        id=block.id,
        task_id=block.task_id,
        date=block.start_at.strftime("%Y-%m-%d"),
        start_time=block.start_at.strftime("%H:%M"),
        end_time=block.end_at.strftime("%H:%M"),
        start_at=block.start_at,
        end_at=block.end_at,
        focus_goal=focus_goal or f"Deep work: {task.title}",
        task_title=task.title,
        course_code=course.code if course else "STUDY",
        course_color=course.color if course else "#5553B7",
        status=block.status.value if hasattr(block.status, "value") else str(block.status),
    )


@router.get("", response_model=ScheduleResponse, summary="Get current study schedule (FR-06)")
async def get_schedule(
    user: CurrentUser,
    db: DbSession,
    page: Paging,
    semester: str | None = None,
) -> ScheduleResponse:
    stmt = (
        select(StudyBlock)
        .options(joinedload(StudyBlock.task).joinedload(Task.course))
        .where(StudyBlock.user_id == user.id)
    )
    if semester:
        stmt = stmt.join(StudyBlock.task).join(Task.course).where(Course.semester == semester)
    stmt = stmt.order_by(StudyBlock.start_at, StudyBlock.id).limit(page.limit).offset(page.offset)
    blocks = list((await db.scalars(stmt)).unique())
    return ScheduleResponse(
        study_blocks=[_to_study_block_out(b, b.task) for b in blocks if b.task],
        overload_warning=False,
    )


@router.post(
    "/generate",
    response_model=ScheduleResponse,
    summary="Generate AI-powered dynamic study schedule (FR-06)",
)
async def generate_schedule(
    user: CurrentUser,
    db: DbSession,
    semester: str | None = None,
    tz: Annotated[str, Query(max_length=64, description="IANA timezone, e.g. Asia/Baku")] = "UTC",
) -> ScheduleResponse:
    user_tz = _resolve_tz(tz)
    # Query 1: incomplete tasks joined with Course
    task_stmt = (
        select(Task)
        .join(Task.course)
        .options(joinedload(Task.course))
        .where(
            Task.user_id == user.id,
            Task.status != TaskStatus.COMPLETED,
            Course.is_archived.is_(False),
        )
    )
    if semester:
        task_stmt = task_stmt.where(Course.semester == semester)
    task_stmt = task_stmt.order_by(Task.due_date).limit(100)
    tasks = list((await db.scalars(task_stmt)).unique())
    if not tasks:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "No pending tasks found to schedule. Add a task first.",
        )

    # Query 2: weekly availability slots (both AVAILABLE and BLOCKED) in 1 query
    slot_stmt = (
        select(AvailabilitySlot)
        .where(AvailabilitySlot.user_id == user.id)
        .order_by(AvailabilitySlot.day_of_week, AvailabilitySlot.start_time)
        .limit(200)
    )
    all_slots = list(await db.scalars(slot_stmt))
    avail_by_dow: dict[int, list[tuple[time, time]]] = {}
    blocked_by_dow: dict[int, list[tuple[time, time]]] = {}
    for s in all_slots:
        target = avail_by_dow if s.kind == SlotKind.AVAILABLE else blocked_by_dow
        target.setdefault(s.day_of_week, []).append((s.start_time, s.end_time))

    if not avail_by_dow:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "No available study hours configured. Add weekly availability slots first.",
        )

    now_local = datetime.now(user_tz)
    today = now_local.date()
    now_time = now_local.time()
    task_map: dict[int, Task] = {t.id: t for t in tasks}

    # Deterministically calculate concrete available calendar windows for next 14 days
    concrete_windows: list[dict] = []
    valid_window_intervals: dict[str, list[tuple[int, int]]] = {}

    for offset in range(14):
        cur_date = today + timedelta(days=offset)
        dow = cur_date.weekday()
        day_avails = avail_by_dow.get(dow, [])
        day_blocked = blocked_by_dow.get(dow, [])
        if not day_avails:
            continue

        for a in day_avails:
            for st, et in _subtract_intervals(a, day_blocked):
                # If today, skip windows that ended in the past
                if cur_date == today and et <= now_time:
                    continue
                actual_st = st
                if cur_date == today and st < now_time < et:
                    m = now_time.hour * 60 + now_time.minute + 5
                    if (et.hour * 60 + et.minute) - m < 30:
                        continue
                    actual_st = time(m // 60, m % 60)

                date_str = cur_date.isoformat()
                concrete_windows.append({
                    "date": date_str,
                    "day_name": cur_date.strftime("%A"),
                    "start_time": actual_st.strftime("%H:%M"),
                    "end_time": et.strftime("%H:%M"),
                })
                s_min = actual_st.hour * 60 + actual_st.minute
                e_min = et.hour * 60 + et.minute
                valid_window_intervals.setdefault(date_str, []).append((s_min, e_min))

    if not concrete_windows:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "All configured study windows for the upcoming days are blocked or in the past. Update your availability.",
        )

    payload = json.dumps(
        {
            "today_date": today.isoformat(),
            "tasks": [
                {
                    "task_id": t.id,
                    "title": t.title,
                    "due_date": t.due_date.strftime("%Y-%m-%d"),
                    "remaining_effort_hours": t.estimated_hours,
                    "syllabus_weight": t.weight_percent,
                }
                for t in tasks
            ],
            "concrete_available_windows": concrete_windows,
        }
    )

    try:
        ai_schedule = await generate_structured(SYSTEM_PROMPT, payload, AIGeneratedSchedule)
    except Exception as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"AI scheduler unavailable: {exc}",
        ) from exc

    # Enforce strict validation: ensure blocks are inside available windows and don't overlap
    created_pairs: list[tuple[StudyBlock, str]] = []
    scheduled_per_day: dict[str, list[tuple[int, int]]] = {}
    overload_flag = ai_schedule.overload_warning

    for item in ai_schedule.study_blocks:
        if item.task_id not in task_map:
            overload_flag = True
            continue
        parsed = _parse_block_datetimes(item.date, item.start_time, item.end_time, user_tz)
        if parsed is None:
            overload_flag = True
            continue
        start_dt, end_dt = parsed

        d_str = item.date[:10]
        st_min = start_dt.hour * 60 + start_dt.minute
        et_min = end_dt.hour * 60 + end_dt.minute

        # 1. Hard check: must fit strictly inside an allowed open window on that date
        allowed = valid_window_intervals.get(d_str, [])
        fits_window = any(w_s <= st_min and et_min <= w_e for w_s, w_e in allowed)
        if not fits_window:
            overload_flag = True
            continue

        # 2. Hard check: cannot overlap with another scheduled session
        day_sessions = scheduled_per_day.get(d_str, [])
        has_overlap = any(not (et_min <= s or st_min >= e) for s, e in day_sessions)
        if has_overlap:
            overload_flag = True
            continue

        db_block = StudyBlock(
            user_id=user.id,
            task_id=item.task_id,
            start_at=start_dt,
            end_at=end_dt,
            status=BlockStatus.PLANNED,
        )
        db.add(db_block)
        day_sessions.append((st_min, et_min))
        scheduled_per_day[d_str] = day_sessions
        created_pairs.append((db_block, item.focus_goal))

    today_start = datetime.combine(today, time.min, tzinfo=user_tz)
    await db.execute(
        delete(StudyBlock).where(
            StudyBlock.user_id == user.id,
            StudyBlock.start_at >= today_start,
            StudyBlock.status == BlockStatus.PLANNED,
        )
    )

    await db.flush()
    await db.commit()

    return ScheduleResponse(
        study_blocks=[
            _to_study_block_out(db_block, task_map[db_block.task_id], focus_goal)
            for db_block, focus_goal in created_pairs
        ],
        overload_warning=overload_flag,
    )
