from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class BlockStatusUpdate(BaseModel):
    status: Literal["pending", "planned", "completed", "missed"]


class AIStudyBlockItem(BaseModel):
    task_id: int
    date: str
    start_time: str
    end_time: str
    focus_goal: str


class AIGeneratedSchedule(BaseModel):
    study_blocks: list[AIStudyBlockItem]
    overload_warning: bool


class StudyBlockOut(AIStudyBlockItem):
    id: int
    task_title: str
    course_code: str
    course_color: str
    status: str
    start_at: datetime
    end_at: datetime


class ScheduleResponse(BaseModel):
    study_blocks: list[StudyBlockOut]
    overload_warning: bool
