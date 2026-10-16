import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.user import User


class BlockStatus(str, enum.Enum):
    PLANNED = "planned"
    COMPLETED = "completed"
    MISSED = "missed"


class StudyBlock(TimestampMixin, Base):
    """AI-generated study session for a task (FR-06, FR-08, FR-10)."""

    __tablename__ = "study_blocks"
    __table_args__ = (CheckConstraint("end_at > start_at", name="end_after_start"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[BlockStatus] = mapped_column(
        Enum(BlockStatus, name="block_status", native_enum=False,
             values_callable=lambda x: [m.value for m in x]),
        default=BlockStatus.PLANNED,
    )

    user: Mapped["User"] = relationship(back_populates="study_blocks")
    task: Mapped["Task"] = relationship(back_populates="study_blocks")

    @property
    def task_title(self) -> str | None:
        return self.task.title if self.task else None

    @property
    def course_code(self) -> str | None:
        return self.task.course.code if self.task and self.task.course else None

    @property
    def course_color(self) -> str | None:
        return self.task.course.color if self.task and self.task.course else None

    @property
    def course_name(self) -> str | None:
        return self.task.course.title if self.task and self.task.course else None
