from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession, Paging, apply_update, delete_owned, get_owned
from app.models import Course
from app.schemas.planner import CourseCreate, CourseRead, CourseUpdate

router = APIRouter(prefix="/courses", tags=["Courses"])

DUPLICATE = "A course with this code already exists for this semester"


async def _commit(db: DbSession) -> None:
    try:
        await db.commit()
    except IntegrityError:  # uq_courses_user_code_semester
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, DUPLICATE)


@router.get("", response_model=list[CourseRead])
async def list_courses(
    user: CurrentUser,
    db: DbSession,
    page: Paging,
    semester: str | None = None,
    include_archived: bool = False,
) -> list[Course]:
    q = select(Course).where(Course.user_id == user.id)
    if semester:
        q = q.where(Course.semester == semester)
    if not include_archived:
        q = q.where(Course.is_archived.is_(False))
    q = q.order_by(Course.semester.desc(), Course.code).limit(page.limit).offset(page.offset)
    return list(await db.scalars(q))


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
async def create_course(body: CourseCreate, user: CurrentUser, db: DbSession) -> Course:
    course = Course(**body.model_dump(), user_id=user.id)
    db.add(course)
    await _commit(db)
    return course


@router.get("/{course_id}", response_model=CourseRead)
async def get_course(course_id: int, user: CurrentUser, db: DbSession) -> Course:
    return await get_owned(db, Course, course_id, user.id)


@router.patch("/{course_id}", response_model=CourseRead, summary="Edit or archive a course")
async def update_course(
    course_id: int, body: CourseUpdate, user: CurrentUser, db: DbSession
) -> Course:
    course = await get_owned(db, Course, course_id, user.id)
    apply_update(course, body, nullable=frozenset({"instructor"}))
    await _commit(db)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: int, user: CurrentUser, db: DbSession) -> None:
    await delete_owned(db, Course, course_id, user.id)
