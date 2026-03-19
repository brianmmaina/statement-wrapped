"""
FastAPI app entry point and route registration.
Binds routers, middleware, lifespan, and health check.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy import select, text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import analysis, ingest, statements, transactions
from app.schemas.health import HealthResponse
from app.core.config import API_KEY, CORS_ORIGINS, REDIS_URL
from app.core.dependencies import async_session, engine
from app.models.category import Category

# global redis client; set in lifespan, used by health and analysis cache
redis_client: Redis | None = None

# default categories; seeded at startup if table is empty
CATEGORY_SEED = [
    ("income", "Income"),
    ("dining", "Dining"),
    ("groceries", "Groceries"),
    ("transport", "Transport"),
    ("subscriptions", "Subscriptions"),
    ("entertainment", "Entertainment"),
    ("shopping", "Shopping"),
    ("utilities", "Utilities"),
    ("other", "Other"),
]


async def _seed_categories():
    """
    Insert default categories if they do not already exist.
    Uses startup event rather than alembic migration because seeding app data in
    migrations is an antipattern; migrations should only change schema.
    """
    async with async_session() as session:
        result = await session.execute(select(Category.slug))
        existing = {r[0] for r in result.fetchall()}
        for slug, name in CATEGORY_SEED:
            if slug not in existing:
                session.add(Category(name=name, slug=slug))
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    async with async_session() as session:
        await session.execute(text("SELECT 1"))
    await _seed_categories()
    redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
    await redis_client.ping()
    app.state.redis = redis_client
    yield
    if redis_client:
        await redis_client.aclose()
    await engine.dispose()


app = FastAPI(title="StatementWrapped", version="0.1.0", lifespan=lifespan)


@app.middleware("http")
async def optional_api_key(request: Request, call_next):
    # skip api key check for health and docs so monitoring and exploration work without auth
    if API_KEY and request.url.path not in ("/health", "/docs", "/openapi.json", "/redoc"):
        key = request.headers.get("X-API-Key")
        if key != API_KEY:
            return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key"})
    return await call_next(request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        raise exc
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


# CORS: localhost for dev; add CORS_ORIGINS env var for production (comma-separated URLs)
_default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
_extra_origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(transactions.router)
app.include_router(statements.router)
app.include_router(analysis.router)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Basic health check. Optionally reports DB, Redis, and OpenAI status."""
    from app.core.config import OPENAI_API_KEY

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
    status["openai_configured"] = bool(OPENAI_API_KEY and len(OPENAI_API_KEY) > 10)
    return HealthResponse(**status)
