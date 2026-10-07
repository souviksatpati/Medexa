"""add referral priority

Revision ID: d7f3a2b1c9e0
Revises: c49a37d8c8f2
Create Date: 2026-09-09 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d7f3a2b1c9e0"
down_revision: Union[str, None] = "77bd181103d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column("referrals", sa.Column("priority", sa.String(length=20), nullable=True))
    op.create_index("ix_referrals_priority", "referrals", ["priority"], unique=False)

def downgrade() -> None:
    op.drop_index("ix_referrals_priority", table_name="referrals")
    op.drop_column("referrals", "priority")
