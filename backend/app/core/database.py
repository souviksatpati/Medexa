from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=False, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    """Every ORM model inherits from this. Alembic's env.py imports this
    metadata to autogenerate migrations."""

    pass


async def get_db():
    """FastAPI dependency — one session per request, always closed."""
    async with AsyncSessionLocal() as session:
        yield session
