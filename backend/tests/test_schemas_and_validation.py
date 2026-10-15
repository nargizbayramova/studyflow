from datetime import UTC, datetime, time, timedelta

import pytest
from pydantic import ValidationError

from app.main import app
from app.models import BlockStatus, SlotKind, TaskPriority, TaskType
from app.schemas.planner import (
    SlotCreate,
    SlotUpdate,
    StudyBlockCreate,
    StudyBlockUpdate,
    TaskCreate,
)


def test_study_block_schema_validation():
    now = datetime.now(UTC)
    later = now + timedelta(hours=2)

    # Valid block
    block = StudyBlockCreate(
        task_id=1,
        start_at=now,
        end_at=later,
        status=BlockStatus.PLANNED,
    )
    assert block.task_id == 1
    assert block.end_at > block.start_at

    # Invalid: end before or equal to start
    with pytest.raises(ValidationError):
        StudyBlockCreate(
            task_id=1,
            start_at=later,
            end_at=now,
        )

    with pytest.raises(ValidationError):
        StudyBlockCreate(
            task_id=1,
            start_at=now,
            end_at=now,
        )


def test_study_block_update_validation():
    now = datetime.now(UTC)
    later = now + timedelta(hours=1)

    # Partial updates allowed
    update = StudyBlockUpdate(status=BlockStatus.COMPLETED)
    assert update.status == BlockStatus.COMPLETED

    # Both provided but invalid
    with pytest.raises(ValidationError):
        StudyBlockUpdate(start_at=later, end_at=now)


def test_slot_schemas_validation():
    # Valid slot
    slot = SlotCreate(
        day_of_week=0,
        start_time=time(9, 0),
        end_time=time(11, 0),
        kind=SlotKind.AVAILABLE,
    )
    assert slot.day_of_week == 0

    # Invalid day of week
    with pytest.raises(ValidationError):
        SlotCreate(
            day_of_week=7,
            start_time=time(9, 0),
            end_time=time(11, 0),
        )

    # Invalid start/end times
    with pytest.raises(ValidationError):
        SlotCreate(
            day_of_week=1,
            start_time=time(12, 0),
            end_time=time(9, 0),
        )

    # SlotUpdate validation
    with pytest.raises(ValidationError):
        SlotUpdate(
            start_time=time(14, 0),
            end_time=time(13, 0),
        )


def test_task_schema_limits():
    now = datetime.now(UTC)
    # Valid task
    task = TaskCreate(
        course_id=1,
        title="Physics Lab",
        type=TaskType.ASSIGNMENT,
        priority=TaskPriority.HIGH,
        due_date=now,
        estimated_hours=2.5,
        weight_percent=15.0,
    )
    assert task.weight_percent == 15.0

    # Negative hours
    with pytest.raises(ValidationError):
        TaskCreate(
            course_id=1,
            title="Lab",
            due_date=now,
            estimated_hours=0,
        )

    # Weight > 100%
    with pytest.raises(ValidationError):
        TaskCreate(
            course_id=1,
            title="Lab",
            due_date=now,
            weight_percent=105.0,
        )


def test_routes_registered():
    paths = app.openapi()["paths"]
    # Check that all Phase 2 & Phase 3 endpoints are wired
    assert "/api/v1/auth/register" in paths
    assert "/api/v1/auth/login" in paths
    assert "/api/v1/auth/me" in paths
    assert "/api/v1/courses" in paths
    assert "/api/v1/courses/{course_id}" in paths
    assert "delete" in paths["/api/v1/courses/{course_id}"]
    assert "/api/v1/tasks" in paths
    assert "/api/v1/tasks/{task_id}" in paths
    assert "/api/v1/availability" in paths
    assert "/api/v1/availability/{slot_id}" in paths
    assert "patch" in paths["/api/v1/availability/{slot_id}"]
    assert "/api/v1/study-blocks" in paths
    assert "/api/v1/study-blocks/{block_id}" in paths
    assert "patch" in paths["/api/v1/study-blocks/{block_id}"]
    assert "delete" in paths["/api/v1/study-blocks/{block_id}"]
    assert "/api/v1/health" in paths
