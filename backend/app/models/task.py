import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.study_block import StudyBlock
    from app.models.user import User


class TaskType(str, enum.Enum):
    ASSIGNMENT = "assignment"
    EXAM = "exam"
    QUIZ = "quiz"
    PROJECT_MILESTONE = "project_milestone"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


def _enum(e: type[enum.Enum], name: str) -> Enum:
    # Stored as VARCHAR + values (not native PG enum) to keep migrations simple.
    return Enum(e, name=name, native_enum=False, values_callable=lambda x: [m.value for m in x])


class Task(TimestampMixin, Base):
    """Academic deliverable (FR-03). Priority fields are filled by the AI (FR-07)."""

    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("weight_percent >= 0 AND weight_percent <= 100", name="weight_range"),
        CheckConstraint("estimated_hours > 0", name="estimated_hours_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    type: Mapped[TaskType] = mapped_column(_enum(TaskType, "task_type"), default=TaskType.ASSIGNMENT)
    status: Mapped[TaskStatus] = mapped_column(
        _enum(TaskStatus, "task_status"), default=TaskStatus.PENDING, index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        _enum(TaskPriority, "task_priority"), default=TaskPriority.MEDIUM
    )
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    estimated_hours: Mapped[float] = mapped_column(Float, default=1.0)
    weight_percent: Mapped[float] = mapped_column(Float, default=0.0)
    ai_priority_score: Mapped[float | None] = mapped_column(Float)
    priority_rank: Mapped[int | None] = mapped_column(Integer, index=True)
    urgency_level: Mapped[str | None] = mapped_column(String(20))
    ai_recommendation: Mapped[str | None] = mapped_column(Text)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="tasks")
    course: Mapped["Course"] = relationship(back_populates="tasks")
    study_blocks: Mapped[list["StudyBlock"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
