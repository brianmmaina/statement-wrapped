"""
Environment variables and application settings.
Centralizes all config so changing a value has a single source of truth.
"""

import os

# postgres connection string; use postgresql+asyncpg:// for async sqlalchemy.
# On Railway, private *.railway.internal fails to resolve; must use DATABASE_PUBLIC_URL.
_raw_db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://statementwrapped:statementwrapped@localhost:5432/statementwrapped")
if ".railway.internal" in _raw_db_url:
    _public = os.getenv("DATABASE_PUBLIC_URL")
    if not _public:
        raise RuntimeError(
            "DATABASE_URL uses Railway private host (*.railway.internal) which fails to resolve. "
            "Fix: In Railway, PostgreSQL service → Settings → enable Public Networking. "
            "Then in API service Variables, add DATABASE_PUBLIC_URL (reference from Postgres) "
            "or override DATABASE_URL with the public connection string."
        )
    _db_url = _public
else:
    _db_url = os.getenv("DATABASE_PUBLIC_URL") or _raw_db_url

# App uses create_async_engine; Railway/others often give postgresql:// (sync). Normalize to +asyncpg.
if _db_url.startswith("postgresql://") and "+asyncpg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
DATABASE_URL = _db_url

# redis connection url; used for health check and analysis caching.
# On Railway, prefer REDIS_PUBLIC_URL when REDIS_URL uses *.railway.internal.
_raw_redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_URL = os.getenv("REDIS_PUBLIC_URL") or _raw_redis_url

# optional api key; when set, all non-health/docs requests require x-api-key header.
# leave unset to disable.
API_KEY = os.getenv("API_KEY")

# openai api key for llm categorization; required when categorization is enabled.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# comma-separated list of allowed CORS origins for production (e.g. https://yourapp.vercel.app).
# when set, these are merged with localhost origins for dev.
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")
