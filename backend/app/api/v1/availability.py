from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, Paging, apply_update, delete_owned, get_owned
from app.models import AvailabilitySlot
from app.schemas.planner import SlotCreate, SlotRead, SlotUpdate

router = APIRouter(prefix="/availability", tags=["Schedule"])


@router.get("", response_model=list[SlotRead], summary="Weekly available / blocked slots (FR-05)")
async def list_slots(user: CurrentUser, db: DbSession, page: Paging) -> list[AvailabilitySlot]:
    q = (
        select(AvailabilitySlot)
        .where(AvailabilitySlot.user_id == user.id)
        .order_by(AvailabilitySlot.day_of_week, AvailabilitySlot.start_time)
        .limit(page.limit).offset(page.offset)
    )
    return list(await db.scalars(q))


@router.post("", response_model=SlotRead, status_code=status.HTTP_201_CREATED)
async def create_slot(body: SlotCreate, user: CurrentUser, db: DbSession) -> AvailabilitySlot:
    slot = AvailabilitySlot(**body.model_dump(), user_id=user.id)
    db.add(slot)
    await db.commit()
    return slot


@router.get("/{slot_id}", response_model=SlotRead)
async def get_slot(slot_id: int, user: CurrentUser, db: DbSession) -> AvailabilitySlot:
    return await get_owned(db, AvailabilitySlot, slot_id, user.id)


@router.patch("/{slot_id}", response_model=SlotRead)
async def update_slot(
    slot_id: int, body: SlotUpdate, user: CurrentUser, db: DbSession
) -> AvailabilitySlot:
    slot = await get_owned(db, AvailabilitySlot, slot_id, user.id)
    new_start = body.start_time if body.start_time is not None else slot.start_time
    new_end = body.end_time if body.end_time is not None else slot.end_time
    if new_end <= new_start:
        raise HTTPException(422, "end_time must be after start_time")
    apply_update(slot, body)
    await db.commit()
    return slot


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slot(slot_id: int, user: CurrentUser, db: DbSession) -> None:
    await delete_owned(db, AvailabilitySlot, slot_id, user.id)
