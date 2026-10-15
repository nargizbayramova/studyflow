from fastapi import APIRouter, HTTPException, Query, status
from pydantic import AwareDatetime
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, Paging, apply_update, delete_owned, get_owned
from app.models import BlockStatus, StudyBlock, Task
from app.schemas.planner import StudyBlockCreate, StudyBlockRead, StudyBlockUpdate

router = APIRouter(prefix="/study-blocks", tags=["Study Blocks"])


@router.get("", response_model=list[StudyBlockRead], summary="List / filter study blocks (FR-09, FR-10)")
async def list_study_blocks(
    user: CurrentUser,
    db: DbSession,
    page: Paging,
    task_id: int | None = None,
    status_: BlockStatus | None = Query(None, alias="status"),
    start_from: AwareDatetime | None = None,
    start_to: AwareDatetime | None = None,
) -> list[StudyBlock]:
    stmt = select(StudyBlock).where(StudyBlock.user_id == user.id)
    if task_id is not None:
        stmt = stmt.where(StudyBlock.task_id == task_id)
    if status_ is not None:
        stmt = stmt.where(StudyBlock.status == status_)
    if start_from is not None:
        stmt = stmt.where(StudyBlock.start_at >= start_from)
    if start_to is not None:
        stmt = stmt.where(StudyBlock.start_at <= start_to)
    stmt = stmt.order_by(StudyBlock.start_at, StudyBlock.id).limit(page.limit).offset(page.offset)
    return list(await db.scalars(stmt))


@router.post("", response_model=StudyBlockRead, status_code=status.HTTP_201_CREATED)
async def create_study_block(
    body: StudyBlockCreate, user: CurrentUser, db: DbSession
) -> StudyBlock:
    await get_owned(db, Task, body.task_id, user.id)
    block = StudyBlock(**body.model_dump(), user_id=user.id)
    db.add(block)
    await db.commit()
    return block


@router.get("/{block_id}", response_model=StudyBlockRead)
async def get_study_block(block_id: int, user: CurrentUser, db: DbSession) -> StudyBlock:
    return await get_owned(db, StudyBlock, block_id, user.id)


@router.patch("/{block_id}", response_model=StudyBlockRead)
async def update_study_block(
    block_id: int, body: StudyBlockUpdate, user: CurrentUser, db: DbSession
) -> StudyBlock:
    block = await get_owned(db, StudyBlock, block_id, user.id)
    if body.task_id is not None and body.task_id != block.task_id:
        await get_owned(db, Task, body.task_id, user.id)
    new_start = body.start_at if body.start_at is not None else block.start_at
    new_end = body.end_at if body.end_at is not None else block.end_at
    if new_end <= new_start:
        raise HTTPException(422, "end_at must be after start_at")
    apply_update(block, body)
    await db.commit()
    return block


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study_block(block_id: int, user: CurrentUser, db: DbSession) -> None:
    await delete_owned(db, StudyBlock, block_id, user.id)
