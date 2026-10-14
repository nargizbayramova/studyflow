import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core.security import DUMMY_HASH, create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.planner import Token, UserCreate, UserRead, UserUpdate
from app.services import monitoring

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate, db: DbSession) -> User:
    # bcrypt is CPU-heavy (~200ms); run it off the event loop.
    hashed = await asyncio.to_thread(hash_password, body.password)
    user = User(email=body.email.lower(), full_name=body.full_name, hashed_password=hashed)
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:  # unique email; relying on the constraint is race-free
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    return user


@router.post("/login", response_model=Token, summary="Log in (OAuth2 form: username = email)")
async def login(
    request: Request, db: DbSession, form: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    email = form.username.lower()
    user = await db.scalar(select(User).where(User.email == email))
    ok = await asyncio.to_thread(
        verify_password, form.password, user.hashed_password if user else DUMMY_HASH
    )
    ok = ok and user is not None and user.is_active
    monitoring.record_login(email, request.client.host if request.client else "?", ok)
    if not ok:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead)
async def read_me(user: CurrentUser) -> User:
    return user


@router.patch("/me", response_model=UserRead)
async def update_me(body: UserUpdate, user: CurrentUser, db: DbSession) -> User:
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.password is not None:
        user.hashed_password = await asyncio.to_thread(hash_password, body.password)
    await db.commit()
    return user
