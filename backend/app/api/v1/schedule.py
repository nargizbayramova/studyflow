from datetime import UTC, date, datetime, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import CurrentUser, DbSession, Paging
from app.models import AvailabilitySlot, BlockStatus, Course, SlotKind, StudyBlock, Task, TaskStatus, TaskType
from app.schemas.schedule import (
    BlockStatusUpdate,
    ScheduleResponse,
    StudyBlockOut,
    WeeklyWorkloadItem,
    WorkloadAnalyticsResponse,
)
from app.services import monitoring
from app.services.ai_client import generate_structured
from app.services.scheduler import (
    _parse_block_datetimes,
    run_ai_schedule,
    to_study_block_out,
)

__all__ = ["router", "_parse_block_datetimes", "generate_structured"]

router = APIRouter(prefix="/schedule", tags=["Schedule"])


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
        study_blocks=[to_study_block_out(b, b.task) for b in blocks if b.task],
        overload_warning=False,
    )


@router.patch(
    "/blocks/{block_id}/status",
    response_model=StudyBlockOut,
    summary="Update a study block status to pending/planned, completed, or missed (FR-08, FR-10)",
)
async def update_block_status(
    block_id: int,
    body: BlockStatusUpdate,
    user: CurrentUser,
    db: DbSession,
) -> StudyBlockOut:
    stmt = (
        select(StudyBlock)
        .options(joinedload(StudyBlock.task).joinedload(Task.course))
        .where(StudyBlock.id == block_id, StudyBlock.user_id == user.id)
    )
    block = (await db.scalars(stmt)).unique().first()
    if block is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "StudyBlock not found")

    block.status = (
        BlockStatus.PLANNED if body.status in ("pending", "planned") else BlockStatus(body.status)
    )
    await db.commit()
    return to_study_block_out(block, block.task)


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
    return await run_ai_schedule(
        db, user.id, semester, tz, rebalance=False, generate_fn=generate_structured
    )


@router.post(
    "/rebalance",
    response_model=ScheduleResponse,
    summary="Dynamically rebalance study schedule around missed sessions and remaining effort (FR-08)",
)
async def rebalance_schedule(
    user: CurrentUser,
    db: DbSession,
    semester: str | None = None,
    tz: Annotated[str, Query(max_length=64, description="IANA timezone, e.g. Asia/Baku")] = "UTC",
) -> ScheduleResponse:
    return await run_ai_schedule(
        db, user.id, semester, tz, rebalance=True, generate_fn=generate_structured
    )


def _ics_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def _build_ics(tasks: list[Task], blocks: list[StudyBlock]) -> str:
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//StudyFlow//EN",
        "CALSCALE:GREGORIAN",
    ]
    for b in blocks:
        code = b.task.course.code if b.task and b.task.course else "STUDY"
        title = b.task.title if b.task else "Study Session"
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:studyblock-{b.id}@studyflow",
            f"DTSTAMP:{stamp}",
            f"DTSTART:{b.start_at.strftime('%Y%m%dT%H%M%S')}",
            f"DTEND:{b.end_at.strftime('%Y%m%dT%H%M%S')}",
            f"SUMMARY:{_ics_escape(f'[{code}] Study: {title}')}",
            f"DESCRIPTION:{_ics_escape(f'StudyFlow session ({b.status.value})')}",
            "END:VEVENT",
        ])
    for t in tasks:
        code = t.course.code if t.course else "TASK"
        due_date = t.due_date.date()
        next_day = due_date + timedelta(days=1)
        desc = t.ai_recommendation or t.description or f"Estimated effort: {t.estimated_hours}h"
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:task-{t.id}@studyflow",
            f"DTSTAMP:{stamp}",
            f"DTSTART;VALUE=DATE:{due_date.strftime('%Y%m%d')}",
            f"DTEND;VALUE=DATE:{next_day.strftime('%Y%m%d')}",
            f"SUMMARY:{_ics_escape(f'[{code}] Deadline: {t.title}')}",
            f"DESCRIPTION:{_ics_escape(desc)}",
            "END:VEVENT",
        ])
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


@router.get("/export.ics", summary="Export schedule and deadlines as RFC 5545 .ics (FR-12)")
async def export_schedule_ics(
    user: CurrentUser,
    db: DbSession,
    semester: str | None = None,
) -> Response:
    tasks_stmt = (
        select(Task)
        .options(selectinload(Task.course))
        .where(Task.user_id == user.id, Task.status != TaskStatus.COMPLETED)
    )
    blocks_stmt = (
        select(StudyBlock)
        .options(selectinload(StudyBlock.task).selectinload(Task.course))
        .where(
            StudyBlock.user_id == user.id,
            StudyBlock.end_at >= datetime.now(UTC),
            StudyBlock.status != BlockStatus.MISSED,
        )
    )
    if semester:
        tasks_stmt = tasks_stmt.join(Task.course).where(Course.semester == semester)
        blocks_stmt = (
            blocks_stmt.join(StudyBlock.task).join(Task.course).where(Course.semester == semester)
        )

    tasks = list(await db.scalars(tasks_stmt.order_by(Task.due_date).limit(500)))
    blocks = list(await db.scalars(blocks_stmt.order_by(StudyBlock.start_at).limit(500)))

    return Response(
        content=_build_ics(tasks, blocks),
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="studyflow_schedule.ics"'},
    )


def _slot_hours(slot: AvailabilitySlot) -> float:
    st = slot.start_time.hour * 60 + slot.start_time.minute
    et = slot.end_time.hour * 60 + slot.end_time.minute
    return max(0.0, (et - st) / 60.0)


def _build_workload_analytics(
    tasks: list[Task],
    blocks: list[StudyBlock],
    slots: list[AvailabilitySlot],
    today: date | None = None,
) -> WorkloadAnalyticsResponse:
    base_date = today or datetime.now(UTC).date()
    monday = base_date - timedelta(days=base_date.weekday())

    recurring_avail_by_dow: dict[int, float] = {}
    date_avail: dict[date, float] = {}
    for s in slots:
        if s.kind != SlotKind.AVAILABLE:
            continue
        hrs = _slot_hours(s)
        spec_date = getattr(s, "specific_date", None)
        if isinstance(spec_date, date):
            date_avail[spec_date] = date_avail.get(spec_date, 0.0) + hrs
        else:
            recurring_avail_by_dow[s.day_of_week] = (
                recurring_avail_by_dow.get(s.day_of_week, 0.0) + hrs
            )

    base_weekly_cap = round(sum(recurring_avail_by_dow.values()), 1)

    completed_by_task: dict[int, float] = {}
    total_planned = 0.0
    total_actual = 0.0
    for b in blocks:
        dur = max(0.0, (b.end_at - b.start_at).total_seconds() / 3600.0)
        if b.status != BlockStatus.MISSED:
            total_planned += dur
        if b.status == BlockStatus.COMPLETED:
            total_actual += dur
            completed_by_task[b.task_id] = completed_by_task.get(b.task_id, 0.0) + dur

    remaining_required = sum(
        max(0.0, t.estimated_hours - completed_by_task.get(t.id, 0.0))
        for t in tasks
        if t.status != TaskStatus.COMPLETED
    )

    weeks: list[WeeklyWorkloadItem] = []
    for w_idx in range(4):
        w_start = monday + timedelta(days=w_idx * 7)
        w_end = w_start + timedelta(days=6)
        label = (
            "This week"
            if w_idx == 0
            else "Next week"
            if w_idx == 1
            else f"{w_start.strftime('%b %-d')}–{w_end.strftime('%b %-d')}"
        )

        w_planned = 0.0
        w_actual = 0.0
        for b in blocks:
            b_date = b.start_at.date()
            if w_start <= b_date <= w_end:
                dur = max(0.0, (b.end_at - b.start_at).total_seconds() / 3600.0)
                if b.status != BlockStatus.MISSED:
                    w_planned += dur
                if b.status == BlockStatus.COMPLETED:
                    w_actual += dur

        w_tasks = [
            t
            for t in tasks
            if t.status != TaskStatus.COMPLETED and w_start <= t.due_date.date() <= w_end
        ]
        w_rem_task_hrs = sum(
            max(0.0, t.estimated_hours - completed_by_task.get(t.id, 0.0)) for t in w_tasks
        )
        has_high_stakes = any(
            t.type == TaskType.EXAM or t.weight_percent >= 25.0 for t in w_tasks
        )

        w_cap = base_weekly_cap
        for d_off in range(7):
            d_cur = w_start + timedelta(days=d_off)
            w_cap += date_avail.get(d_cur, 0.0)

        demand = max(w_planned, w_rem_task_hrs)
        reason: str | None = None
        stress: Literal["low", "moderate", "high"] = "low"

        if w_cap > 0 and demand > w_cap:
            stress = "high"
            reason = f"{demand:.1f}h workload exceeds {w_cap:.1f}h available capacity"
        elif demand >= 15.0:
            stress = "high"
            reason = f"Heavy workload ({demand:.1f}h) scheduled in one week"
        elif len(w_tasks) >= 3:
            stress = "high"
            reason = f"{len(w_tasks)} deadlines clustered this week"
        elif has_high_stakes and demand >= 8.0:
            stress = "high"
            reason = "High-stakes exam or major milestone due"
        elif demand >= 8.0 or len(w_tasks) >= 2 or (w_cap > 0 and demand >= 0.6 * w_cap):
            stress = "moderate"

        weeks.append(
            WeeklyWorkloadItem(
                week_start=w_start.isoformat(),
                week_end=w_end.isoformat(),
                label=label,
                planned_hours=round(w_planned, 1),
                actual_hours=round(w_actual, 1),
                remaining_task_hours=round(w_rem_task_hrs, 1),
                capacity_hours=round(w_cap, 1),
                tasks_due_count=len(w_tasks),
                stress_level=stress,
                is_high_stress=(stress == "high"),
                warning_reason=reason,
            )
        )

    completion_pct = round((total_actual / total_planned) * 100) if total_planned > 0 else 0

    return WorkloadAnalyticsResponse(
        total_planned_hours=round(total_planned, 1),
        total_actual_hours=round(total_actual, 1),
        completion_rate_pct=min(100, completion_pct),
        remaining_required_hours=round(remaining_required, 1),
        weekly_capacity_hours=base_weekly_cap,
        high_stress_weeks_count=sum(1 for w in weeks if w.is_high_stress),
        weeks=weeks,
    )


@router.get(
    "/analytics",
    response_model=WorkloadAnalyticsResponse,
    summary="Visual workload analytics: planned vs. actual hours & high-stress week warnings (FR-14)",
)
async def get_workload_analytics(
    user: CurrentUser,
    db: DbSession,
    semester: str | None = None,
) -> WorkloadAnalyticsResponse:
    tasks_stmt = select(Task).where(Task.user_id == user.id)
    blocks_stmt = select(StudyBlock).where(StudyBlock.user_id == user.id)
    if semester:
        tasks_stmt = tasks_stmt.join(Task.course).where(Course.semester == semester)
        blocks_stmt = (
            blocks_stmt.join(StudyBlock.task).join(Task.course).where(Course.semester == semester)
        )
    slots_stmt = select(AvailabilitySlot).where(AvailabilitySlot.user_id == user.id)

    tasks = list(await db.scalars(tasks_stmt.limit(500)))
    blocks = list(await db.scalars(blocks_stmt.limit(500)))
    slots = list(await db.scalars(slots_stmt.limit(200)))

    return _build_workload_analytics(tasks, blocks, slots)
