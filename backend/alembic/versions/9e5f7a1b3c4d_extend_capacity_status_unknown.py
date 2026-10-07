"""extend capacity status with explicit unknown value

Revision ID: 9e5f7a1b3c4d
Revises: 8d4e7f1a2b3c
"""
from typing import Sequence, Union

from alembic import op

revision: str = "9e5f7a1b3c4d"
down_revision: Union[str, None] = "8d4e7f1a2b3c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # UNKNOWN is meaningful for synthetic service records: the source does
    # not establish whether capacity is available, limited, or full. Preserve
    # that uncertainty rather than manufacturing an operational claim.
    op.execute(
        "ALTER TYPE capacitystatus "
        "ADD VALUE IF NOT EXISTS 'UNKNOWN'"
    )


def downgrade() -> None:
    # PostgreSQL does not support removing an enum value directly. Retain the
    # value rather than destructively rewriting existing service records.
    pass
