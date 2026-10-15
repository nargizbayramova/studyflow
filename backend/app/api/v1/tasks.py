from datetime import UTC, datetime

from fastapi import APIRouter, Query, status
from pydantic import AwareDatetime
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, Paging, apply_update, delete_owned, get_owned
from app.models import Course, Task, TaskPriority, TaskStatus, TaskType
from app.schemas.planner import TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Tasks"])


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
    type_: TaskType | None = Query(None, alias="type"),
    status_: TaskStatus | None = Query(None, alias="status"),
    priority: TaskPriority | None = None,
    due_from: AwareDatetime | None = None,
    due_to: AwareDatetime | None = None,
    q: str | None = Query(None, max_length=100, description="Case-insensitive title search"),
) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user.id)
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
    stmt = stmt.order_by(Task.due_date, Task.id).limit(page.limit).offset(page.offset)
    return list(await db.scalars(stmt))


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(body: TaskCreate, user: CurrentUser, db: DbSession) -> Task:
    await get_owned(db, Course, body.course_id, user.id)  # can't attach tasks to others' courses
    task = Task(**body.model_dump(), user_id=user.id)
    _sync_completed_at(task)
    db.add(task)
    await db.commit()
    return task


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
