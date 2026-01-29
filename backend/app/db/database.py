from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    pool_size=20,          # Increase base pool from 5 to 20
    max_overflow=10,        # Allow 10 extra connections during peaks
    pool_timeout=30,        # Wait up to 30s for a connection
    pool_recycle=1800,      # Recycle connections every 30 mins to prevent stale links
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
