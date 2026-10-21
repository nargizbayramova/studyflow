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


class WeeklyWorkloadItem(BaseModel):
    week_start: str
    week_end: str
    label: str
    planned_hours: float
    actual_hours: float
    remaining_task_hours: float
    capacity_hours: float
    tasks_due_count: int
    stress_level: Literal["low", "moderate", "high"]
    is_high_stress: bool
    warning_reason: str | None = None


class WorkloadAnalyticsResponse(BaseModel):
    total_planned_hours: float
    total_actual_hours: float
    completion_rate_pct: int
    remaining_required_hours: float
    weekly_capacity_hours: float
    high_stress_weeks_count: int
    weeks: list[WeeklyWorkloadItem]
