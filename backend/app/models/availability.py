import enum
from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, Enum, ForeignKey, SmallInteger, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class SlotKind(str, enum.Enum):
    AVAILABLE = "available"
    BLOCKED = "blocked"


class AvailabilitySlot(TimestampMixin, Base):
    """Weekly recurring available / blocked time window (FR-05)."""

    __tablename__ = "availability_slots"
    __table_args__ = (
        CheckConstraint("day_of_week >= 0 AND day_of_week <= 6", name="day_of_week_range"),
        CheckConstraint("end_time > start_time", name="end_after_start"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day_of_week: Mapped[int] = mapped_column(SmallInteger)  # 0 = Monday ... 6 = Sunday
    specific_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    kind: Mapped[SlotKind] = mapped_column(
        Enum(SlotKind, name="slot_kind", native_enum=False,
             values_callable=lambda x: [m.value for m in x]),
        default=SlotKind.AVAILABLE,
    )

    user: Mapped["User"] = relationship(back_populates="availability_slots")
