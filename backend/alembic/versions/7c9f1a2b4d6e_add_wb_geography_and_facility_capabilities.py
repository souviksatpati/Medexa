"""add WB geography and facility capabilities

Revision ID: 7c9f1a2b4d6e
Revises: 231eff2db3d3
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7c9f1a2b4d6e"
down_revision: Union[str, None] = "231eff2db3d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
         "districts",
         sa.Column("id", sa.String(20), primary_key=True),
         sa.Column("state_code", sa.String(20), nullable=False),
         sa.Column("state_name", sa.String(100), nullable=False),
         sa.Column("district_code", sa.String(20), nullable=False, unique=True),
         sa.Column("name", sa.String(150), nullable=False),
    )
    op.create_index("ix_districts_state_code", "districts", ["state_code"])
    op.create_index("ix_districts_district_code", "districts", ["district_code"], unique=True)
    op.create_index("ix_districts_name", "districts", ["name"])

    op.create_table(
         "subdistricts",
         sa.Column("id", sa.String(20), primary_key=True),
         sa.Column("district_id", sa.String(20), sa.ForeignKey("districts.id"), nullable=False),
         sa.Column("district_code", sa.String(20), nullable=False),
         sa.Column("name", sa.String(150), nullable=False),
         sa.Column("subdistrict_code", sa.String(20), nullable=False, unique=True),
    )
    for column in ("district_id", "district_code", "name", "subdistrict_code"):
         op.create_index(
             f"ix_subdistricts_{column}",
             "subdistricts",
             [column],
             unique=column == "subdistrict_code",
         )

    op.create_table(
         "blocks",
         sa.Column("id", sa.String(20), primary_key=True),
         sa.Column("district_id", sa.String(20), sa.ForeignKey("districts.id"), nullable=False),
         sa.Column("district_code", sa.String(20), nullable=False),
         sa.Column("name", sa.String(150), nullable=False),
         sa.Column("block_code", sa.String(20), nullable=False, unique=True),
    )
    for column in ("district_id", "district_code", "name", "block_code"):
         op.create_index(
             f"ix_blocks_{column}",
             "blocks",
             [column],
             unique=column == "block_code",
         )

    op.create_table(
         "local_bodies",
         sa.Column("id", sa.String(20), primary_key=True),
         sa.Column("district_id", sa.String(20), sa.ForeignKey("districts.id"), nullable=False),
         sa.Column("district_code", sa.String(20), nullable=False),
         sa.Column("name", sa.String(200), nullable=False),
         sa.Column("localbody_code", sa.String(20), nullable=False, unique=True),
    )
    for column in ("district_id", "district_code", "name", "localbody_code"):
         op.create_index(
             f"ix_local_bodies_{column}",
             "local_bodies",
             [column],
             unique=column == "localbody_code",
         )

    op.create_table(
         "locations",
         sa.Column("id", sa.String(40), primary_key=True),
         sa.Column("state_code", sa.String(20), nullable=False),
         sa.Column("state_name", sa.String(100), nullable=False),
         sa.Column("district_id", sa.String(20), sa.ForeignKey("districts.id"), nullable=False),
         sa.Column("district_code", sa.String(20), nullable=False),
         sa.Column(
             "subdistrict_id",
             sa.String(20),
             sa.ForeignKey("subdistricts.id"),
             nullable=True,
         ),
         sa.Column("subdistrict_code", sa.String(20), nullable=True),
         sa.Column(
             "block_id",
             sa.String(20),
             sa.ForeignKey("blocks.id"),
             nullable=True,
         ),
         sa.Column("block_code", sa.String(20), nullable=True),
         sa.Column(
             "local_body_id",
             sa.String(20),
             sa.ForeignKey("local_bodies.id"),
             nullable=True,
         ),
         sa.Column("localbody_code", sa.String(20), nullable=True),
         sa.Column("village_code", sa.String(30), nullable=True),
         sa.Column("name", sa.String(200), nullable=False),
         sa.Column("village_status", sa.String(50), nullable=True),
         sa.Column("census_2011_code", sa.String(40), nullable=True),
    )
    for column in (
         "district_id",
         "district_code",
         "subdistrict_id",
         "subdistrict_code",
         "block_id",
         "block_code",
         "local_body_id",
         "localbody_code",
         "village_code",
         "name",
    ):
         op.create_index(f"ix_locations_{column}", "locations", [column])

    # PostgreSQL enum types cannot safely be replaced by SQLAlchemy's ALTER
    # TYPE machinery here. Add only the new values; existing rows retain their
    # original enum values without a table rewrite.
    op.execute("ALTER TYPE facilitytype ADD VALUE IF NOT EXISTS 'CHC'")
    op.execute("ALTER TYPE facilitytype ADD VALUE IF NOT EXISTS 'STATE_HOSPITAL'")

    # Explicitly create new PostgreSQL enum types before columns/tables
    # reference them.
    coordinate_status_enum = sa.Enum(
        "PRESENT",
        "MISSING_OR_INVALID",
        name="coordinatestatus",
    )
    coordinate_status_enum.create(op.get_bind(), checkfirst=True)
    capacity_status_enum = sa.Enum(
        "AVAILABLE",
        "LIMITED",
        "FULL",
        name="capacitystatus",
    )

    op.add_column(
         "facilities",
         sa.Column("ownership", sa.String(100), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("district_mapping_confident", sa.Boolean(), nullable=True),
    )
    op.execute(
         "UPDATE facilities "
         "SET district_mapping_confident = TRUE "
         "WHERE district_mapping_confident IS NULL"
    )
    op.alter_column(
         "facilities",
         "district_mapping_confident",
         nullable=False,
    )
    op.add_column(
         "facilities",
         sa.Column("subdistrict", sa.String(150), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("pincode", sa.String(20), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column(
             "coordinate_status",
             coordinate_status_enum,
             nullable=True,
         ),
    )
    op.execute(
        "UPDATE facilities "
        "SET coordinate_status = CASE "
        "WHEN latitude IS NOT NULL AND longitude IS NOT NULL "
        "THEN 'PRESENT'::coordinatestatus "
        "ELSE 'MISSING_OR_INVALID'::coordinatestatus "
        "END"
    )
    op.alter_column(
         "facilities",
         "coordinate_status",
         nullable=False,
    )
    op.add_column(
         "facilities",
         sa.Column("coordinate_confidence", sa.String(50), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("coordinate_source", sa.String(150), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("source", sa.String(150), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("source_record_id", sa.String(150), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("verification_status", sa.String(100), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("facility_category", sa.String(150), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("facility_care_type", sa.String(150), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("medicine_system", sa.String(100), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("telephone", sa.String(50), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("mobile_number", sa.String(50), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("emergency_number", sa.String(50), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("website", sa.String(500), nullable=True),
    )
    op.add_column(
         "facilities",
         sa.Column("specialties_raw", sa.String(4000), nullable=True),
    )

    op.create_index(
         "ix_facilities_subdistrict",
         "facilities",
         ["subdistrict"],
    )
    op.create_index(
         "ix_facilities_pincode",
         "facilities",
         ["pincode"],
    )
    op.create_index(
         "ix_facilities_coordinate_status",
         "facilities",
         ["coordinate_status"],
    )
    op.create_index(
         "ix_facilities_source",
         "facilities",
         ["source"],
    )
    op.create_index(
         "ix_facilities_source_record_id",
         "facilities",
         ["source_record_id"],
    )

    op.create_table(
         "facility_services",
         sa.Column(
             "facility_id",
             sa.String(36),
             sa.ForeignKey("facilities.id", ondelete="CASCADE"),
             nullable=False,
         ),
         sa.Column("service_name", sa.String(150), nullable=False),
         sa.Column(
             "available",
             sa.Boolean(),
             nullable=False,
             server_default=sa.true(),
         ),
         sa.Column(
             "capacity_status",
             capacity_status_enum,
             nullable=False,
         ),
         sa.Column(
             "last_updated",
             sa.DateTime(timezone=True),
             nullable=False,
         ),
         sa.Column("id", sa.String(36), primary_key=True),
         sa.UniqueConstraint(
             "facility_id",
             "service_name",
             name="uq_facility_service_name",
         ),
    )
    op.create_index(
         "ix_facility_services_facility_id",
         "facility_services",
         ["facility_id"],
    )
    op.create_index(
         "ix_facility_services_service_name",
         "facility_services",
         ["service_name"],
    )
    op.create_index(
         "ix_facility_services_capacity_status",
         "facility_services",
         ["capacity_status"],
    )


def downgrade() -> None:
    op.drop_table("facility_services")

    for index in (
         "ix_facilities_source_record_id",
         "ix_facilities_source",
         "ix_facilities_coordinate_status",
         "ix_facilities_pincode",
         "ix_facilities_subdistrict",
    ):
         op.drop_index(index, table_name="facilities")

    for column in (
         "specialties_raw",
         "website",
         "emergency_number",
         "mobile_number",
         "telephone",
         "medicine_system",
         "facility_care_type",
         "facility_category",
         "verification_status",
         "source_record_id",
         "source",
         "coordinate_source",
         "coordinate_confidence",
         "coordinate_status",
         "pincode",
         "subdistrict",
         "district_mapping_confident",
         "ownership",
    ):
         op.drop_column("facilities", column)

    op.execute("DROP TYPE IF EXISTS capacitystatus")
    op.execute("DROP TYPE IF EXISTS coordinatestatus")

    op.drop_table("locations")
    op.drop_table("local_bodies")
    op.drop_table("blocks")
    op.drop_table("subdistricts")
    op.drop_table("districts")
