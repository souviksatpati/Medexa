"""widen facility telephone field

Revision ID: 77bd181103d6
Revises: c49a37d8c8f2
Create Date: 2026-09-05 22:28:05.574381

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "77bd181103d6"
down_revision: Union[str, None] = "c49a37d8c8f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "facilities",
        "telephone",
        existing_type=sa.String(length=50),
        type_=sa.String(length=255),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "facilities",
        "telephone",
        existing_type=sa.String(length=255),
        type_=sa.String(length=50),
        existing_nullable=True,
    )
