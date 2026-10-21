from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import CurrentUser, DbSession, Paging
from app.models import BlockStatus, Course, StudyBlock, Task, TaskStatus
from app.schemas.schedule import BlockStatusUpdate, ScheduleResponse, StudyBlockOut
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
