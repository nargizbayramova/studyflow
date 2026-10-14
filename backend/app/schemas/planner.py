from datetime import datetime, time
from typing import Annotated

from pydantic import AwareDatetime, BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models import SlotKind, TaskPriority, TaskStatus, TaskType

Str = lambda max_len: Annotated[str, Field(min_length=1, max_length=max_len)]  # noqa: E731
# bcrypt only uses the first 72 bytes; reject longer instead of silently truncating.
Password = Annotated[str, Field(min_length=8, max_length=72)]
Color = Annotated[str, Field(pattern=r"^#[0-9A-Fa-f]{6}$")]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Auth / users ---

class UserCreate(BaseModel):
    email: EmailStr
    password: Password
    full_name: Str(120)


class UserUpdate(BaseModel):
    full_name: Str(120) | None = None
    password: Password | None = None


class UserRead(ORM):
    id: int
    email: EmailStr
    full_name: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Courses ---

class CourseCreate(BaseModel):
    code: Str(20)
    title: Str(200)
    instructor: Str(120) | None = None
    semester: Str(30)
    color: Color = "#4F46E5"


class CourseUpdate(BaseModel):
    code: Str(20) | None = None
    title: Str(200) | None = None
    instructor: Str(120) | None = None
    semester: Str(30) | None = None
    color: Color | None = None
    is_archived: bool | None = None


class CourseRead(ORM):
    id: int
    code: str
    title: str
    instructor: str | None
    semester: str
    color: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime


# --- Tasks ---

class TaskCreate(BaseModel):
    course_id: int
    title: Str(200)
    description: str | None = None
    type: TaskType = TaskType.ASSIGNMENT
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: AwareDatetime
    estimated_hours: float = Field(1.0, gt=0, le=1000)
    weight_percent: float = Field(0.0, ge=0, le=100)


class TaskUpdate(BaseModel):
    course_id: int | None = None
    title: Str(200) | None = None
    description: str | None = None
    type: TaskType | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: AwareDatetime | None = None
    estimated_hours: float | None = Field(None, gt=0, le=1000)
    weight_percent: float | None = Field(None, ge=0, le=100)


class TaskRead(ORM):
    id: int
    course_id: int
    title: str
    description: str | None
    type: TaskType
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime
    estimated_hours: float
    weight_percent: float
    ai_priority_score: float | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


# --- Availability ---

class SlotCreate(BaseModel):
    day_of_week: int = Field(ge=0, le=6, description="0 = Monday ... 6 = Sunday")
    start_time: time
    end_time: time
    kind: SlotKind = SlotKind.AVAILABLE

    @model_validator(mode="after")
    def _end_after_start(self) -> "SlotCreate":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class SlotRead(ORM):
    id: int
    day_of_week: int
    start_time: time
    end_time: time
    kind: SlotKind
