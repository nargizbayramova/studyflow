import json
from datetime import UTC, date, datetime, time

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DbSession, Paging
from app.models import AvailabilitySlot, BlockStatus, Course, SlotKind, StudyBlock, Task, TaskStatus
from app.schemas.schedule import AIGeneratedSchedule, ScheduleResponse, StudyBlockOut
from app.services.ai_client import generate_structured

router = APIRouter(prefix="/schedule", tags=["Schedule"])

SYSTEM_PROMPT = (
    "You are an academic study scheduler. Distribute each task's remaining_effort_hours "
    "across the user's weekly available_windows starting from today_date up to each task's due_date "
    "(note: day_of_week 0=Monday .. 6=Sunday). "
    "Prioritize closer deadlines and higher syllabus_weight. "
    "Keep every study block between 45 and 120 minutes (HH:MM 24-hour format, end_time > start_time) "
    "with a concise actionable focus_goal. "
    "If total required hours exceed available slots before deadlines, schedule as much as fits and "
    "set overload_warning=true; otherwise set overload_warning=false."
)


def _parse_block_datetimes(
    date_str: str, start_str: str, end_str: str
) -> tuple[datetime, datetime] | None:
    try:
        d = date.fromisoformat(date_str[:10])
        st = time.fromisoformat(start_str[:5])
        et = time.fromisoformat(end_str[:5])
        start_dt = datetime.combine(d, st, tzinfo=UTC)
        end_dt = datetime.combine(d, et, tzinfo=UTC)
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
) -> ScheduleResponse:
    # Query 1: incomplete tasks joined with Course (indexed on user_id, status)
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

    # Query 2: weekly available study slots (indexed on user_id)
    slot_stmt = (
        select(AvailabilitySlot)
        .where(
            AvailabilitySlot.user_id == user.id,
            AvailabilitySlot.kind == SlotKind.AVAILABLE,
        )
        .order_by(AvailabilitySlot.day_of_week, AvailabilitySlot.start_time)
        .limit(100)
    )
    slots = list(await db.scalars(slot_stmt))
    if not slots:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "No available study hours configured. Add weekly availability slots first.",
        )

    today = datetime.now(UTC).date()
    task_map: dict[int, Task] = {t.id: t for t in tasks}
    payload = json.dumps(
        {
            "today_date": today.isoformat(),
            "today_day_of_week": today.weekday(),
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
            "available_windows": [
                {
                    "day_of_week": s.day_of_week,
                    "start_time": s.start_time.strftime("%H:%M"),
                    "end_time": s.end_time.strftime("%H:%M"),
                }
                for s in slots
            ],
        }
    )

    try:
        ai_schedule = await generate_structured(SYSTEM_PROMPT, payload, AIGeneratedSchedule)
    except Exception as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"AI scheduler unavailable: {exc}",
        ) from exc

    today_start = datetime.combine(today, time.min, tzinfo=UTC)
    await db.execute(
        delete(StudyBlock).where(
            StudyBlock.user_id == user.id,
            StudyBlock.start_at >= today_start,
            StudyBlock.status == BlockStatus.PLANNED,
        )
    )

    created_pairs: list[tuple[StudyBlock, str]] = []
    for item in ai_schedule.study_blocks:
        if item.task_id not in task_map:
            continue
        parsed = _parse_block_datetimes(item.date, item.start_time, item.end_time)
        if parsed is None:
            continue
        start_dt, end_dt = parsed
        db_block = StudyBlock(
            user_id=user.id,
            task_id=item.task_id,
            start_at=start_dt,
            end_at=end_dt,
            status=BlockStatus.PLANNED,
        )
        db.add(db_block)
        created_pairs.append((db_block, item.focus_goal))

    await db.flush()
    await db.commit()

    return ScheduleResponse(
        study_blocks=[
            _to_study_block_out(db_block, task_map[db_block.task_id], focus_goal)
            for db_block, focus_goal in created_pairs
        ],
        overload_warning=ai_schedule.overload_warning,
    )
