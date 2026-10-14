from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# psycopg 3 is natively async, so the same URL works for the async engine and Alembic's sync one.
engine = create_async_engine(settings.sqlalchemy_database_uri, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, autoflush=False, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a DB session per request."""
    async with SessionLocal() as db:
        yield db
