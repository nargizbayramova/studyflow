from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DbSession, Paging
from app.models import BlockStatus, Course, StudyBlock, Task
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
    res = await run_ai_schedule(
        db, user.id, semester, tz, rebalance=False, generate_fn=generate_structured
    )
    monitoring.record_ai_success(
        action="Schedule Generation",
        user_id=user.id,
        details=f"Generated {len(res.study_blocks)} study blocks",
    )
    return res


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
    res = await run_ai_schedule(
        db, user.id, semester, tz, rebalance=True, generate_fn=generate_structured
    )
    monitoring.record_ai_success(
        action="Schedule Rebalance",
        user_id=user.id,
        details=f"Rebalanced {len(res.study_blocks)} study blocks",
    )
    return res
