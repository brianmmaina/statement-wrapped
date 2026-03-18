import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from sqlalchemy import text

from database import async_session, engine
from routers import ingest, transactions

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client: Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    # Startup: verify DB and Redis
    async with async_session() as session:
        await session.execute(text("SELECT 1"))
    redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
    await redis_client.ping()
    yield
    # Shutdown
    if redis_client:
        await redis_client.aclose()
    await engine.dispose()


app = FastAPI(title="StatementWrapped", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(transactions.router)


@app.get("/health")
async def health():
    """Basic health check. Optionally reports DB and Redis status."""
    status = {"status": "ok"}
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        status["database"] = "ok"
    except Exception as e:
        status["database"] = str(e)
    try:
        if redis_client:
            await redis_client.ping()
        status["redis"] = "ok"
    except Exception as e:
        status["redis"] = str(e)
    return status
