"""extend coordinate status provenance

Revision ID: 8d4e7f1a2b3c
Revises: 7c9f1a2b4d6e
"""
from typing import Sequence, Union

from alembic import op

revision: str = "8d4e7f1a2b3c"
down_revision: Union[str, None] = "7c9f1a2b4d6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Preserve the distinction between coordinates that were absent from the
    # supplied source and coordinates that were supplied but unusable.
    op.execute(
        "ALTER TYPE coordinatestatus "
        "ADD VALUE IF NOT EXISTS 'MISSING_IN_SUPPLIED_SOURCE'"
    )


def downgrade() -> None:
    # PostgreSQL does not support removing an enum value directly. The value is
    # intentionally retained on downgrade rather than risking destructive data
    # rewriting. A future migration can rebuild the enum if removal is ever
    # required.
    pass
