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


def test_cors_origins_sanitization():
    from app.core.config import Settings

    s1 = Settings(CORS_ORIGINS="https://studyflow-two-pied.vercel.app/")
    assert s1.CORS_ORIGINS == ["https://studyflow-two-pied.vercel.app"]

    s2 = Settings(CORS_ORIGINS='"https://studyflow-two-pied.vercel.app/", "http://localhost:5173"')
    assert "https://studyflow-two-pied.vercel.app" in s2.CORS_ORIGINS
    assert "http://localhost:5173" in s2.CORS_ORIGINS


def test_cors_middleware_strict_origins():
    from starlette.testclient import TestClient

    client = TestClient(app)
    # Whitelisted origin allowed
    res_allowed = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res_allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Random origin rejected
    res_blocked = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://malicious-site.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res_blocked.headers.get("access-control-allow-origin") is None


def test_study_block_read_with_joined_task_and_course():
    from unittest.mock import MagicMock
    from app.schemas.planner import StudyBlockRead

    now = datetime.now(UTC)
    mock_block = MagicMock()
    mock_block.id = 1
    mock_block.task_id = 10
    mock_block.start_at = now
    mock_block.end_at = now + timedelta(hours=1)
    mock_block.status = BlockStatus.PLANNED
    mock_block.created_at = now
    mock_block.updated_at = now
    mock_block.task_title = "Final Project"
    mock_block.course_code = "CS 201"
    mock_block.course_color = "#5553B7"
    mock_block.course_name = "Data Structures"

    read = StudyBlockRead.model_validate(mock_block)
    assert read.task_title == "Final Project"
    assert read.course_code == "CS 201"
    assert read.course_color == "#5553B7"
    assert read.course_name == "Data Structures"


@pytest.mark.anyio
async def test_generate_schedule_endpoint(monkeypatch):
    from unittest.mock import AsyncMock, MagicMock
    from app.api.v1 import schedule as schedule_api
    from app.schemas.schedule import AIGeneratedSchedule, AIStudyBlockItem

    paths = app.openapi()["paths"]
    assert "/api/v1/schedule" in paths
    assert "/api/v1/schedule/generate" in paths

    mock_course = MagicMock(code="CS101", color="#4F46E5", title="Intro CS")
    mock_task = MagicMock(
        id=42,
        title="Midterm Prep",
        due_date=datetime.now(UTC) + timedelta(days=3),
        estimated_hours=2.0,
        weight_percent=25.0,
        course=mock_course,
    )
    mock_slot = MagicMock(day_of_week=0, start_time=time(9, 0), end_time=time(11, 0))

    scalars_calls = [[mock_task], [mock_slot]]

    class FakeScalarResult:
        def __init__(self, items):
            self._items = items

        def unique(self):
            return self._items

        def __iter__(self):
            return iter(self._items)

    mock_db = MagicMock()
    mock_db.scalars = AsyncMock(side_effect=lambda _: FakeScalarResult(scalars_calls.pop(0)))
    mock_db.execute = AsyncMock()
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()

    def _assign_id(obj):
        obj.id = 99

    mock_db.add = MagicMock(side_effect=_assign_id)

    fake_ai_result = AIGeneratedSchedule(
        study_blocks=[
            AIStudyBlockItem(
                task_id=42,
                date="2026-10-19",
                start_time="09:00",
                end_time="10:30",
                focus_goal="Review lecture notes",
            )
        ],
        overload_warning=True,
    )
    monkeypatch.setattr(
        schedule_api, "generate_structured", AsyncMock(return_value=fake_ai_result)
    )

    mock_user = MagicMock(id=7)
    res = await schedule_api.generate_schedule(user=mock_user, db=mock_db, semester="Fall 2026")
    assert res.overload_warning is True
    assert len(res.study_blocks) == 1
    out = res.study_blocks[0]
    assert out.id == 99
    assert out.task_id == 42
    assert out.task_title == "Midterm Prep"
    assert out.course_code == "CS101"
    assert out.course_color == "#4F46E5"
    assert out.focus_goal == "Review lecture notes"
    assert out.status == "planned"
