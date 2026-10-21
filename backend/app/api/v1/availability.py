from datetime import date, time
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, Paging, apply_update, delete_owned, get_owned
from app.models import AvailabilitySlot, SlotKind
from app.schemas.planner import SlotCreate, SlotRead, SlotUpdate

router = APIRouter(prefix="/availability", tags=["Schedule"])


async def _assert_no_overlapping_slots(
    db: DbSession,
    user_id: int,
    day_of_week: int,
    specific_date: date | None,
    start_time: time,
    end_time: time,
    exclude_slot_id: int | None = None,
) -> None:
    """Ensures no existing available or blocked slot crosses the given time interval."""
    q = select(AvailabilitySlot).where(
        AvailabilitySlot.user_id == user_id,
        AvailabilitySlot.day_of_week == day_of_week,
    )
    if exclude_slot_id is not None:
        q = q.where(AvailabilitySlot.id != exclude_slot_id)

    existing_slots = list(await db.scalars(q))
    for s in existing_slots:
        if exclude_slot_id is not None and s.id == exclude_slot_id:
            continue
        # Separate specific dates on different weeks do not cross
        if specific_date is not None and s.specific_date is not None and s.specific_date != specific_date:
            continue
        # Overlap condition for half-open intervals [start, end)
        if start_time < s.end_time and end_time > s.start_time:
            kind_label = "available" if s.kind == SlotKind.AVAILABLE else "blocked"
            s_range = f"{s.start_time.strftime('%H:%M')}–{s.end_time.strftime('%H:%M')}"
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Time window overlaps with existing {kind_label} slot ({s_range}). Slots cannot overlap.",
            )


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
    await _assert_no_overlapping_slots(
        db, user.id, body.day_of_week, body.specific_date, body.start_time, body.end_time
    )
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

    new_date = body.specific_date if "specific_date" in body.model_fields_set else slot.specific_date
    new_dow = (
        new_date.weekday()
        if new_date is not None
        else (body.day_of_week if body.day_of_week is not None else slot.day_of_week)
    )

    await _assert_no_overlapping_slots(
        db, user.id, new_dow, new_date, new_start, new_end, exclude_slot_id=slot.id
    )

    apply_update(slot, body, nullable=frozenset({"specific_date"}))
    slot.day_of_week = new_dow
    await db.commit()
    return slot


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slot(slot_id: int, user: CurrentUser, db: DbSession) -> None:
    await delete_owned(db, AvailabilitySlot, slot_id, user.id)
