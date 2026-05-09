from uuid import uuid4
from urllib.parse import urlsplit

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from app.core.runtime import is_running_on_vercel
from sqlalchemy.pool import NullPool

def _database_host() -> str:
    return (urlsplit(settings.DATABASE_URL).hostname or "").lower()


def _database_port() -> int | None:
    return urlsplit(settings.DATABASE_URL).port


def _uses_transaction_pooler() -> bool:
    host = _database_host()
    port = _database_port()

    if settings.DB_POOL_MODE == "transaction":
        return True
    if settings.DB_POOL_MODE == "direct":
        return False

    return "pooler." in host or port == 6543


def _should_require_ssl() -> bool:
    if settings.DB_SSL_MODE == "require":
        return True
    if settings.DB_SSL_MODE == "disable":
        return False

    host = _database_host()
    return host not in {"", "localhost", "127.0.0.1"}


use_transaction_pooler = _uses_transaction_pooler()
connect_args = {}

if _should_require_ssl():
    connect_args["ssl"] = "require"

if use_transaction_pooler:
    connect_args["prepared_statement_cache_size"] = 0
    connect_args["prepared_statement_name_func"] = lambda: f"__asyncpg_{uuid4()}__"
else:
    connect_args["prepared_statement_cache_size"] = settings.DB_PREPARED_STATEMENT_CACHE_SIZE

if settings.DB_DISABLE_POSTGRES_JIT:
    connect_args["server_settings"] = {"jit": "off"}

engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}

if connect_args:
    engine_kwargs["connect_args"] = connect_args

if is_running_on_vercel() or use_transaction_pooler:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs.update(
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
    )

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
