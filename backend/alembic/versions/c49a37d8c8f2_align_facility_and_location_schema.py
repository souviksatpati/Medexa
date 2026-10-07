"""align facility and location schema

Revision ID: c49a37d8c8f2
Revises: a8aa8a909447
Create Date: 2026-09-05 22:00:57.910840

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c49a37d8c8f2"
down_revision: Union[str, None] = "a8aa8a909447"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Align facilities.district with the ORM and the supplied WB dataset.
    # Some legitimate facility records have no district value.
    op.alter_column(
        "facilities",
        "district",
        existing_type=sa.String(length=100),
        type_=sa.String(length=150),
        existing_nullable=False,
        nullable=True,
    )

    # Support filtering/indexing facilities by facility type.
    op.create_index(
        "ix_facilities_facility_type",
        "facilities",
        ["facility_type"],
        unique=False,
    )

    # Support state-level geographic queries.
    op.create_index(
        "ix_locations_state_code",
        "locations",
        ["state_code"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_locations_state_code",
        table_name="locations",
    )

    op.drop_index(
        "ix_facilities_facility_type",
        table_name="facilities",
    )

    # Restore the previous database definition.
    # This assumes no NULL district values were introduced after upgrade.
    op.alter_column(
        "facilities",
        "district",
        existing_type=sa.String(length=150),
        type_=sa.String(length=100),
        existing_nullable=True,
        nullable=False,
    )
