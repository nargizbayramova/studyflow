"""Import all models here so Alembic autogenerate sees them."""
from app.models.availability import AvailabilitySlot, SlotKind
from app.models.base import Base
from app.models.course import Course
from app.models.study_block import BlockStatus, StudyBlock
from app.models.task import Task, TaskPriority, TaskStatus, TaskType
from app.models.user import User

__all__ = [
    "Base", "User", "Course", "Task", "TaskType", "TaskStatus", "TaskPriority",
    "AvailabilitySlot", "SlotKind", "StudyBlock", "BlockStatus",
]
