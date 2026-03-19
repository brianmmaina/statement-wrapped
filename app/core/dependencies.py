"""
Shared FastAPI dependencies: db session and redis client.
get_db yields a session that auto-commits on success and rolls back on exception.
"""

from collections.abc import AsyncGenerator
from typing import Optional

from fastapi import Request
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def get_redis(request: Request) -> Optional[Redis]:
    """Return redis client from app state."""
    return getattr(request.app.state, "redis", None)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a db session; commits on success, rolls back on exception.
    Without this pattern, each route would need manual commit/rollback; forgetting
    one would cause silent data loss or unhandled errors.
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
