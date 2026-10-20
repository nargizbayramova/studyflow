import json
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import AwareDatetime
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DbSession, Paging, apply_update, delete_owned, get_owned
from app.models import Course, Task, TaskPriority, TaskStatus, TaskType
from app.schemas.planner import AITaskPrioritizationResult, TaskCreate, TaskRead, TaskUpdate
from app.services import monitoring
from app.services.ai_client import generate_structured

router = APIRouter(prefix="/tasks", tags=["Tasks"])

PRIORITIZE_PROMPT = (
    "You are an academic advisor. Rank all pending tasks from 1 (highest priority) to N based on: "
    "1. Deadline proximity (days remaining from CURRENT_DATE until due_date). "
    "2. Syllabus grade weight (syllabus_weight). "
    "3. Task complexity / effort (estimated_effort). "
    "Assign urgency_level as one of: CRITICAL, HIGH, MEDIUM, LOW. "
    "Provide a sharp, actionable 1-sentence ai_recommendation on why to tackle this task now."
)
VALID_URGENCY = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}


def _sync_completed_at(task: Task) -> None:
    if task.status == TaskStatus.COMPLETED:
        task.completed_at = task.completed_at or datetime.now(UTC)
    else:
        task.completed_at = None


@router.get("", response_model=list[TaskRead], summary="List / filter / search tasks (FR-11)")
async def list_tasks(
    user: CurrentUser,
    db: DbSession,
    page: Paging,
    course_id: int | None = None,
    semester: str | None = None,
    type_: TaskType | None = Query(None, alias="type"),
    status_: TaskStatus | None = Query(None, alias="status"),
    priority: TaskPriority | None = None,
    due_from: AwareDatetime | None = None,
    due_to: AwareDatetime | None = None,
    q: str | None = Query(None, max_length=100, description="Case-insensitive title search"),
) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user.id)
    if semester:
        stmt = stmt.join(Task.course).where(Course.semester == semester)
    if course_id is not None:
        stmt = stmt.where(Task.course_id == course_id)
    if type_ is not None:
        stmt = stmt.where(Task.type == type_)
    if status_ is not None:
        stmt = stmt.where(Task.status == status_)
    if priority is not None:
        stmt = stmt.where(Task.priority == priority)
    if due_from is not None:
        stmt = stmt.where(Task.due_date >= due_from)
    if due_to is not None:
        stmt = stmt.where(Task.due_date <= due_to)
    if q:
        stmt = stmt.where(Task.title.icontains(q, autoescape=True))
    stmt = (
        stmt.order_by(Task.priority_rank.asc().nulls_last(), Task.due_date, Task.id)
        .limit(page.limit)
        .offset(page.offset)
    )
    return list(await db.scalars(stmt))


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(body: TaskCreate, user: CurrentUser, db: DbSession) -> Task:
    await get_owned(db, Course, body.course_id, user.id)  # can't attach tasks to others' courses
    task = Task(**body.model_dump(), user_id=user.id)
    _sync_completed_at(task)
    db.add(task)
    await db.commit()
    return task


@router.post(
    "/prioritize",
    response_model=list[TaskRead],
    summary="Prioritize pending tasks with AI recommendations (FR-07)",
)
async def prioritize_tasks(
    user: CurrentUser,
    db: DbSession,
    semester: str | None = None,
) -> list[Task]:
    stmt = (
        select(Task)
        .join(Task.course)
        .options(joinedload(Task.course))
        .where(Task.user_id == user.id, Task.status != TaskStatus.COMPLETED)
    )
    if semester:
        stmt = stmt.where(Course.semester == semester)
    stmt = stmt.order_by(Task.due_date, Task.id).limit(100)
    tasks = list((await db.scalars(stmt)).unique())
    if not tasks:
        return []

    payload = json.dumps(
        {
            "CURRENT_DATE": datetime.now(UTC).strftime("%Y-%m-%d"),
            "tasks": [
                {
                    "task_id": t.id,
                    "title": t.title,
                    "course_code": t.course.code if t.course else "GENERAL",
                    "due_date": t.due_date.strftime("%Y-%m-%d"),
                    "estimated_effort": t.estimated_hours,
                    "syllabus_weight": t.weight_percent,
                }
                for t in tasks
            ],
        }
    )

    try:
        ai_result = await generate_structured(PRIORITIZE_PROMPT, payload, AITaskPrioritizationResult)
    except Exception as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"AI prioritization unavailable: {exc}",
        ) from exc

    now = datetime.now(UTC)
    task_map = {t.id: t for t in tasks}
    bulk_updates: list[dict] = []
    updates_by_id: dict[int, tuple[int, str, str]] = {}
    for item in ai_result.ranked_tasks:
        if item.task_id not in task_map:
            continue
        urgency = item.urgency_level.upper().strip()
        if urgency not in VALID_URGENCY:
            urgency = "MEDIUM"
        updates_by_id[item.task_id] = (item.priority_rank, urgency, item.ai_recommendation)
        bulk_updates.append(
            {
                "id": item.task_id,
                "priority_rank": item.priority_rank,
                "urgency_level": urgency,
                "ai_recommendation": item.ai_recommendation,
                "updated_at": now,
            }
        )

    if bulk_updates:
        await db.execute(
            update(Task).execution_options(synchronize_session=False),
            bulk_updates,
        )
        await db.commit()

    for tid, (rank, urgency, rec) in updates_by_id.items():
        t = task_map[tid]
        t.priority_rank = rank
        t.urgency_level = urgency
        t.ai_recommendation = rec
        t.updated_at = now

    monitoring.record_ai_success(
        action="Task Prioritization",
        user_id=user.id,
        details=f"Ranked and prioritized {len(tasks)} tasks",
    )

    return sorted(tasks, key=lambda t: (t.priority_rank is None, t.priority_rank or 0, t.due_date))


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: int, user: CurrentUser, db: DbSession) -> Task:
    return await get_owned(db, Task, task_id, user.id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(task_id: int, body: TaskUpdate, user: CurrentUser, db: DbSession) -> Task:
    task = await get_owned(db, Task, task_id, user.id)
    if body.course_id is not None and body.course_id != task.course_id:
        await get_owned(db, Course, body.course_id, user.id)
    apply_update(task, body, nullable=frozenset({"description"}))
    _sync_completed_at(task)
    await db.commit()
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, user: CurrentUser, db: DbSession) -> None:
    await delete_owned(db, Task, task_id, user.id)
