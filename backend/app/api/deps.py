from typing import Annotated, TypeVar

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import Base, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(db: DbSession, token: str = Depends(oauth2_scheme)) -> User:
    user_id = decode_access_token(token)
    user = await db.get(User, user_id) if user_id is not None else None
    if user is None or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


class Page:
    """Bounded pagination for every list endpoint."""

    def __init__(self, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)) -> None:
        self.limit, self.offset = limit, offset


Paging = Annotated[Page, Depends()]

M = TypeVar("M", bound=Base)


async def get_owned(db: AsyncSession, model: type[M], obj_id: int, user_id: int) -> M:
    """Fetch a row owned by the user; 404 (not 403) so other users' ids aren't revealed."""
    obj = await db.scalar(select(model).where(model.id == obj_id, model.user_id == user_id))
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{model.__name__} not found")
    return obj


async def delete_owned(db: AsyncSession, model: type[Base], obj_id: int, user_id: int) -> None:
    """One DELETE round-trip; children go via the FK's ON DELETE CASCADE."""
    result = await db.execute(delete(model).where(model.id == obj_id, model.user_id == user_id))
    if result.rowcount == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{model.__name__} not found")
    await db.commit()


def apply_update(obj: Base, body: BaseModel, nullable: frozenset[str] = frozenset()) -> None:
    """Apply only the fields the client sent (PATCH semantics)."""
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is None and field not in nullable:
            raise HTTPException(422, f"{field} cannot be null")
        setattr(obj, field, value)
