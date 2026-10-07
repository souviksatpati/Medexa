import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

TEST_DATABASE_URL = "postgresql+asyncpg://medexa_user:medexa_pass@localhost:5432/medexa_test"

"""
Real-database integration fixtures. The unit test suite (test_*.py
elsewhere in this folder) deliberately never touches a live database —
that's correct for testing pure logic (state machine, risk engines, SLA
math) fast and in isolation. But it also means NOTHING in the existing
suite could have caught the identity-map staleness bug found in this
session: a rescue action was correctly written to the database, but a
same-session re-query returned the same stale Python object with its
already-loaded rescue_actions collection unchanged, because
SQLAlchemy's identity map does not overwrite an already-populated
relationship on a repeat query without `populate_existing=True`.

This file exists specifically to give that class of bug a place to be
caught automatically going forward. Requires a real Postgres reachable
at TEST_DATABASE_URL (see backend README for how to stand one up) —
these tests are skipped, not failed, if that database isn't reachable,
so the rest of the suite stays fast and dependency-free by default.
"""

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session():
    try:
        async with TestSessionLocal() as session:
            yield session
            await session.rollback()
    except Exception as exc:
        pytest.skip(f"Test database not reachable at {TEST_DATABASE_URL}: {exc}")
