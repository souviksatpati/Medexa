"""allow missing facility type

Revision ID: a8aa8a909447
Revises: 9e5f7a1b3c4d
Create Date: ...
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a8aa8a909447"
down_revision: Union[str, None] = "9e5f7a1b3c4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "facilities",
        "facility_type",
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "facilities",
        "facility_type",
        nullable=False,
    )
