import json
from collections.abc import Awaitable, Callable
from datetime import UTC, date, datetime, time, timedelta, tzinfo
from typing import TypedDict
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import HTTPException, status
from google.genai.errors import APIError
from pydantic import ValidationError
from sqlalchemy import delete, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models import AvailabilitySlot, BlockStatus, Course, SlotKind, StudyBlock, Task, TaskStatus
from app.schemas.schedule import AIGeneratedSchedule, ScheduleResponse, StudyBlockOut
from app.services import monitoring
from app.services.ai_client import generate_structured

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

AI_PROVIDER_EXCEPTIONS = (APIError, TimeoutError, ValidationError, ValueError, RuntimeError, OSError)


class AvailableWindowPayload(TypedDict):
    date: str
    day_name: str
    start_time: str
    end_time: str


class TaskSchedulePayload(TypedDict):
    task_id: int
    title: str
    due_date: str
    remaining_effort_hours: float
    syllabus_weight: float


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

    return [(to_time(s), to_time(e)) for s, e in cur_intervals if e - s >= 30]


def _resolve_tz(tz: str) -> tzinfo:
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


def to_study_block_out(block: StudyBlock, task: Task, focus_goal: str = "") -> StudyBlockOut:
    course = getattr(task, "course", None)
    return StudyBlockOut(
        id=block.id or 0,
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


async def _load_concrete_windows(
    db: AsyncSession, user_id: int, today: date, now_time: time
) -> tuple[list[AvailableWindowPayload], dict[str, list[tuple[int, int]]]]:
    slot_stmt = (
        select(AvailabilitySlot)
        .where(AvailabilitySlot.user_id == user_id)
        .order_by(AvailabilitySlot.day_of_week, AvailabilitySlot.start_time)
        .limit(200)
    )
    all_slots = list(await db.scalars(slot_stmt))
    avail_by_dow: dict[int, list[tuple[time, time]]] = {}
    blocked_by_dow: dict[int, list[tuple[time, time]]] = {}
    avail_by_date: dict[date, list[tuple[time, time]]] = {}
    blocked_by_date: dict[date, list[tuple[time, time]]] = {}
    for s in all_slots:
        slot_specific_date = getattr(s, "specific_date", None)
        if isinstance(slot_specific_date, date):
            date_target = avail_by_date if s.kind == SlotKind.AVAILABLE else blocked_by_date
            date_target.setdefault(slot_specific_date, []).append((s.start_time, s.end_time))
        else:
            target = avail_by_dow if s.kind == SlotKind.AVAILABLE else blocked_by_dow
            target.setdefault(s.day_of_week, []).append((s.start_time, s.end_time))

    if not avail_by_dow and not avail_by_date:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "No available study hours configured. Add weekly availability slots first.",
        )

    concrete_windows: list[AvailableWindowPayload] = []
    valid_window_intervals: dict[str, list[tuple[int, int]]] = {}

    for offset in range(14):
        cur_date = today + timedelta(days=offset)
        dow = cur_date.weekday()
        day_avails = avail_by_dow.get(dow, []) + avail_by_date.get(cur_date, [])
        day_blocked = blocked_by_dow.get(dow, []) + blocked_by_date.get(cur_date, [])
        if not day_avails:
            continue

        for a in day_avails:
            for st, et in _subtract_intervals(a, day_blocked):
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

    return concrete_windows, valid_window_intervals


def _validate_ai_blocks(
    ai_schedule: AIGeneratedSchedule,
    user_id: int,
    user_tz: tzinfo,
    task_map: dict[int, Task],
    valid_window_intervals: dict[str, list[tuple[int, int]]],
) -> tuple[list[tuple[StudyBlock, str]], bool]:
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

        allowed = valid_window_intervals.get(d_str, [])
        if not any(w_s <= st_min and et_min <= w_e for w_s, w_e in allowed):
            overload_flag = True
            continue

        day_sessions = scheduled_per_day.get(d_str, [])
        if any(not (et_min <= s or st_min >= e) for s, e in day_sessions):
            overload_flag = True
            continue

        db_block = StudyBlock(
            user_id=user_id,
            task_id=item.task_id,
            start_at=start_dt,
            end_at=end_dt,
            status=BlockStatus.PLANNED,
        )
        day_sessions.append((st_min, et_min))
        scheduled_per_day[d_str] = day_sessions
        created_pairs.append((db_block, item.focus_goal))

    return created_pairs, overload_flag


async def _mark_past_planned_blocks_missed(
    db: AsyncSession, user_id: int, today_start: datetime
) -> None:
    await db.execute(
        update(StudyBlock)
        .where(
            StudyBlock.user_id == user_id,
            StudyBlock.start_at < today_start,
            StudyBlock.status == BlockStatus.PLANNED,
        )
        .values(status=BlockStatus.MISSED, updated_at=datetime.now(UTC))
        .execution_options(synchronize_session=False)
    )


async def _load_schedulable_tasks(
    db: AsyncSession, user_id: int, semester: str | None, *, include_blocks: bool
) -> list[Task]:
    load_opts = (
        (selectinload(Task.course), selectinload(Task.study_blocks))
        if include_blocks
        else (joinedload(Task.course),)
    )
    stmt = (
        select(Task)
        .join(Task.course)
        .options(*load_opts)
        .where(
            Task.user_id == user_id,
            Task.status != TaskStatus.COMPLETED,
            Course.is_archived.is_(False),
        )
    )
    if semester:
        stmt = stmt.where(Course.semester == semester)
    stmt = stmt.order_by(Task.due_date).limit(100)
    tasks = list((await db.scalars(stmt)).unique())
    if not tasks:
        msg = (
            "No incomplete tasks found to rebalance."
            if include_blocks
            else "No pending tasks found to schedule. Add a task first."
        )
        raise HTTPException(status.HTTP_400_BAD_REQUEST, msg)
    return tasks


def _calculate_remaining_effort(task: Task, *, subtract_completed: bool) -> float:
    if not subtract_completed:
        return task.estimated_hours
    completed_hours = sum(
        max(0.0, (b.end_at - b.start_at).total_seconds() / 3600.0)
        for b in (task.study_blocks or [])
        if b.status == BlockStatus.COMPLETED
    )
    return max(0.5, round(task.estimated_hours - completed_hours, 2))


def _build_task_payloads(
    tasks: list[Task], *, subtract_completed: bool
) -> list[TaskSchedulePayload]:
    return [
        {
            "task_id": t.id,
            "title": t.title,
            "due_date": t.due_date.strftime("%Y-%m-%d"),
            "remaining_effort_hours": _calculate_remaining_effort(
                t, subtract_completed=subtract_completed
            ),
            "syllabus_weight": t.weight_percent,
        }
        for t in tasks
    ]


async def _request_ai_schedule(
    today: date,
    task_payloads: list[TaskSchedulePayload],
    concrete_windows: list[AvailableWindowPayload],
    *,
    rebalance: bool,
    generate_fn: Callable[[str, str, type[AIGeneratedSchedule]], Awaitable[AIGeneratedSchedule]],
) -> AIGeneratedSchedule:
    tasks_key = "tasks_to_reschedule" if rebalance else "tasks"
    payload = json.dumps(
        {
            "CURRENT_DATE": today.isoformat(),
            "today_date": today.isoformat(),
            tasks_key: task_payloads,
            "concrete_available_windows": concrete_windows,
        }
    )
    try:
        return await generate_fn(SYSTEM_PROMPT, payload, AIGeneratedSchedule)
    except AI_PROVIDER_EXCEPTIONS as exc:
        monitoring.record_ai_failure(exc)
        label = "AI rebalancer" if rebalance else "AI scheduler"
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"{label} unavailable: {exc}") from exc


async def _delete_future_planned_blocks(
    db: AsyncSession, user_id: int, today_start: datetime
) -> None:
    """Removes upcoming planned sessions before inserting a fresh schedule."""
    await db.execute(
        delete(StudyBlock).where(
            StudyBlock.user_id == user_id,
            StudyBlock.start_at >= today_start,
            StudyBlock.status == BlockStatus.PLANNED,
        )
    )


async def _delete_uncompleted_for_rebalance(
    db: AsyncSession, user_id: int, today_start: datetime
) -> None:
    """Removes missed and upcoming uncompleted blocks while strictly preserving completed history."""
    await db.execute(
        delete(StudyBlock).where(
            StudyBlock.user_id == user_id,
            StudyBlock.status != BlockStatus.COMPLETED,
            or_(
                StudyBlock.start_at >= today_start,
                StudyBlock.status == BlockStatus.MISSED,
            ),
        )
    )


async def _persist_generated_schedule(
    db: AsyncSession,
    user_id: int,
    today_start: datetime,
    created_pairs: list[tuple[StudyBlock, str]],
    task_map: dict[int, Task],
    overload_flag: bool,
) -> ScheduleResponse:
    for db_block, _ in created_pairs:
        db.add(db_block)
    await _delete_future_planned_blocks(db, user_id, today_start)
    await db.flush()
    await db.commit()

    return ScheduleResponse(
        study_blocks=[
            to_study_block_out(db_block, task_map[db_block.task_id], focus_goal)
            for db_block, focus_goal in created_pairs
        ],
        overload_warning=overload_flag,
    )


async def _persist_rebalanced_schedule(
    db: AsyncSession,
    user_id: int,
    today_start: datetime,
    created_pairs: list[tuple[StudyBlock, str]],
    task_map: dict[int, Task],
    overload_flag: bool,
) -> ScheduleResponse:
    await _delete_uncompleted_for_rebalance(db, user_id, today_start)
    if created_pairs:
        db.add_all([b for b, _ in created_pairs])
    await db.flush()
    await db.commit()

    all_blocks_stmt = (
        select(StudyBlock)
        .where(StudyBlock.user_id == user_id)
        .order_by(StudyBlock.start_at, StudyBlock.id)
        .limit(500)
    )
    all_blocks = list((await db.scalars(all_blocks_stmt)).unique())
    focus_by_id = {b.id: goal for b, goal in created_pairs if b.id is not None}
    focus_by_obj = {id(b): goal for b, goal in created_pairs}

    return ScheduleResponse(
        study_blocks=[
            to_study_block_out(
                b,
                task_map[b.task_id],
                focus_by_id.get(b.id) or focus_by_obj.get(id(b), ""),
            )
            for b in all_blocks
            if b.task_id in task_map
        ],
        overload_warning=overload_flag,
    )


async def run_ai_schedule(
    db: AsyncSession,
    user_id: int,
    semester: str | None = None,
    tz: str = "UTC",
    *,
    rebalance: bool = False,
    generate_fn: Callable[[str, str, type[AIGeneratedSchedule]], Awaitable[AIGeneratedSchedule]] = generate_structured,
) -> ScheduleResponse:
    """Orchestrates initial AI schedule generation (FR-06) and dynamic rebalancing (FR-08).

    Transaction boundary: owns and commits the unit-of-work once validated blocks are persisted.
    """
    user_tz = _resolve_tz(tz)
    now_local = datetime.now(user_tz)
    today = now_local.date()
    today_start = datetime.combine(today, time.min, tzinfo=user_tz)

    if rebalance:
        await _mark_past_planned_blocks_missed(db, user_id, today_start)

    tasks = await _load_schedulable_tasks(db, user_id, semester, include_blocks=rebalance)
    concrete_windows, valid_window_intervals = await _load_concrete_windows(
        db, user_id, today, now_local.time()
    )
    task_map: dict[int, Task] = {t.id: t for t in tasks}
    task_payloads = _build_task_payloads(tasks, subtract_completed=rebalance)

    ai_schedule = await _request_ai_schedule(
        today,
        task_payloads,
        concrete_windows,
        rebalance=rebalance,
        generate_fn=generate_fn,
    )
    created_pairs, overload_flag = _validate_ai_blocks(
        ai_schedule, user_id, user_tz, task_map, valid_window_intervals
    )

    action = "Schedule Rebalance" if rebalance else "Schedule Generation"
    if rebalance:
        res = await _persist_rebalanced_schedule(
            db, user_id, today_start, created_pairs, task_map, overload_flag
        )
    else:
        res = await _persist_generated_schedule(
            db, user_id, today_start, created_pairs, task_map, overload_flag
        )
    monitoring.record_ai_success(
        action=action,
        user_id=user_id,
        details=f"{'Rebalanced' if rebalance else 'Generated'} {len(res.study_blocks)} study blocks",
    )
    return res
