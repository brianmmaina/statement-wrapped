"""
Shared pytest fixtures for StatementWrapped test suite.
"""

import os
from pathlib import Path
from unittest.mock import patch

import pytest
from fakeredis import FakeAsyncRedis
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Set test database URL before any app imports that read DATABASE_URL.
# Use TEST_DATABASE_URL if set (e.g. CI with statementwrapped_test); else use DATABASE_URL.
_test_db_url = os.getenv(
    "TEST_DATABASE_URL",
    os.getenv("DATABASE_URL", "postgresql+asyncpg://statementwrapped:statementwrapped@localhost:5432/statementwrapped"),
)
os.environ["DATABASE_URL"] = _test_db_url

from app.core.dependencies import get_db, get_redis
from app.main import app
from app.models import Base

# Test engine and session factory
test_engine = create_async_engine(_test_db_url, echo=False)
test_async_session = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def csv_fixtures():
    """Paths to sample CSV files for each bank format."""
    return {
        "chase": FIXTURES_DIR / "chase_sample.csv",
        "boa": FIXTURES_DIR / "boa_sample.csv",
        "apple_card": FIXTURES_DIR / "apple_card_sample.csv",
        "wells_fargo": FIXTURES_DIR / "wells_fargo_sample.csv",
    }


@pytest.fixture
async def db_engine():
    """Create test database tables and yield engine."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield test_engine
    await test_engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Provide a database session with transaction rollback for isolation."""
    async with test_engine.connect() as conn:
        await conn.begin()
        async with AsyncSession(bind=conn, expire_on_commit=False) as session:
            try:
                yield session
            finally:
                await session.rollback()
                await conn.rollback()


@pytest.fixture
async def redis_client():
    """Provide a FakeAsyncRedis instance for tests."""
    client = FakeAsyncRedis(decode_responses=True)
    yield client
    await client.aclose()


@pytest.fixture
async def client(db_session, redis_client):
    """Provide FastAPI test client with overridden DB and Redis."""
    # Patch Redis.from_url so app lifespan uses FakeAsyncRedis instead of real Redis
    import redis.asyncio as redis_asyncio
    with patch.object(redis_asyncio.Redis, "from_url", return_value=redis_client):
        async def override_get_db():
            try:
                yield db_session
            finally:
                pass

        def override_get_redis():
            return redis_client

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_redis] = override_get_redis

        # Seed categories for tests that need them (same transaction, rolled back with session)
        from app.models.category import Category
        from app.main import CATEGORY_SEED
        for slug, name in CATEGORY_SEED:
            existing = await db_session.execute(
                text("SELECT 1 FROM categories WHERE slug = :slug"), {"slug": slug}
            )
            if existing.scalar() is None:
                db_session.add(Category(name=name, slug=slug))
        await db_session.flush()

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            yield ac

        app.dependency_overrides.clear()
