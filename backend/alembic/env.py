import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import Base + all models (via app.models's exhaustive import list) so
# autogenerate can see every table. This is the single most common
# source of "migration didn't pick up my new model" bugs — that import
# list must stay exhaustive as the schema grows (see app/models/__init__.py).
from app.core.database import Base
from app.core.config import settings
import app.models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
LEGACY_GEOGRAPHY_UNIQUE_CONSTRAINTS = {
    "districts_district_code_key",
    "subdistricts_subdistrict_code_key",
    "blocks_block_code_key",
    "local_bodies_localbody_code_key",
}


def include_object(object_, name, type_, reflected, compare_to):
    """Keep intentional legacy geography constraints out of autogenerate drift."""
    if (
        type_ == "unique_constraint"
        and reflected
        and name in LEGACY_GEOGRAPHY_UNIQUE_CONSTRAINTS
    ):
        return False

    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        include_object=include_object,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
