import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine
from sqlalchemy import pool

from app.models import Base, Category, Statement, Transaction  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    # On Railway, private *.railway.internal fails to resolve; must use DATABASE_PUBLIC_URL.
    url = os.getenv("DATABASE_URL", "postgresql+asyncpg://statementwrapped:statementwrapped@localhost:5432/statementwrapped")
    if ".railway.internal" in url:
        url = os.getenv("DATABASE_PUBLIC_URL") or ""
        if not url:
            raise RuntimeError(
                "DATABASE_URL uses Railway private host (*.railway.internal). "
                "Fix: PostgreSQL → Settings → enable Public Networking. "
                "Then add DATABASE_PUBLIC_URL (reference) or override DATABASE_URL with public URL."
            )
    else:
        url = os.getenv("DATABASE_PUBLIC_URL") or url
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(
        get_url(),
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
