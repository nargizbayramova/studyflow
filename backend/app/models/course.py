from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.user import User


class Course(TimestampMixin, Base):
    """A course a student is enrolled in (FR-02). Archived instead of deleted."""

    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint("user_id", "code", "semester", name="uq_courses_user_code_semester"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200))
    instructor: Mapped[str | None] = mapped_column(String(120))
    semester: Mapped[str] = mapped_column(String(30))
    color: Mapped[str] = mapped_column(String(7), default="#4F46E5", server_default="#4F46E5")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    user: Mapped["User"] = relationship(back_populates="courses")
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
