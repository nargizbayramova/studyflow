from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, Paging, delete_owned
from app.models import AvailabilitySlot
from app.schemas.planner import SlotCreate, SlotRead

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


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slot(slot_id: int, user: CurrentUser, db: DbSession) -> None:
    await delete_owned(db, AvailabilitySlot, slot_id, user.id)
