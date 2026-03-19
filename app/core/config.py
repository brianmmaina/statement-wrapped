"""
Environment variables and application settings.
Centralizes all config so changing a value has a single source of truth.
"""

import os

# postgres connection string; use postgresql+asyncpg:// for async sqlalchemy.
# changing this breaks db connectivity.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://statementwrapped:statementwrapped@localhost:5432/statementwrapped",
)

# redis connection url; used for health check and analysis caching.
# changing this breaks redis connectivity.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# optional api key; when set, all non-health/docs requests require x-api-key header.
# leave unset to disable.
API_KEY = os.getenv("API_KEY")

# openai api key for llm categorization; required when categorization is enabled.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# comma-separated list of allowed CORS origins for production (e.g. https://yourapp.vercel.app).
# when set, these are merged with localhost origins for dev.
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")
