"""Import validated Medexa West Bengal master data into PostgreSQL.

This script imports reference/master data only. Synthetic operational data is
intentionally a separate concern and should be loaded by the demo seed script.

Validation runs first. The database transaction is rolled back on any error.

The importer uses PostgreSQL bulk upserts rather than row-by-row ORM lookups,
making it suitable for the full West Bengal master dataset.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.facility import (
    AvailabilityLevel,
    CoordinateStatus,
    Facility,
    FacilityType,
)
from app.models.facility_service import CapacityStatus, FacilityService
from app.models.geography import (
    Block,
    District,
    LocalBody,
    Location,
    Subdistrict,
)
from scripts.validate_wb_data import validate


BATCH_SIZE = 1000


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def clean(value: str | None) -> str | None:
    value = (value or "").strip()
    return value or None


def bool_value(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "y"}


def enum_or_none(enum_cls, value: str | None):
    value = clean(value)
    return enum_cls(value.lower()) if value else None


def dt(value: str | None) -> datetime:
    value = clean(value)
    if not value:
        return datetime.now(timezone.utc)

    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))

    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def is_empty_geography_row(
    row: dict[str, str],
    code_key: str,
    name_key: str,
) -> bool:
    return not clean(row.get(code_key)) and not clean(row.get(name_key))


async def bulk_upsert(
    db: AsyncSession,
    model: Any,
    rows: list[dict[str, Any]],
    batch_size: int = BATCH_SIZE,
) -> None:
    """Bulk upsert rows using PostgreSQL INSERT ... ON CONFLICT DO UPDATE."""

    if not rows:
        return

    table = model.__table__
    primary_key = table.primary_key.columns[0].name

    update_columns = [
        column.name
        for column in table.columns
        if column.name != primary_key
    ]

    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]

        stmt = insert(table).values(batch)

        update_values = {
            column: getattr(stmt.excluded, column)
            for column in update_columns
        }

        stmt = stmt.on_conflict_do_update(
            index_elements=[primary_key],
            set_=update_values,
        )

        await db.execute(stmt)


async def import_data(data_dir: Path) -> None:
    if validate(data_dir) != 0:
        raise RuntimeError("Dataset validation failed; import aborted.")

    districts = read_csv(data_dir / "medexa_districts.csv")
    subdistricts = read_csv(data_dir / "medexa_subdistricts.csv")
    blocks = read_csv(data_dir / "medexa_blocks.csv")
    local_bodies = read_csv(data_dir / "medexa_local_bodies.csv")
    locations = read_csv(data_dir / "medexa_locations.csv")
    facilities = read_csv(data_dir / "medexa_facilities.csv")

    service_path = data_dir / "medexa_synthetic_facility_services.csv"
    services = read_csv(service_path) if service_path.exists() else []

    # ------------------------------------------------------------------
    # Districts
    # ------------------------------------------------------------------

    district_rows: list[dict[str, Any]] = []

    for row in districts:
        district_code = clean(row["district_code"])

        district_rows.append(
            {
                "id": district_code,
                "state_code": clean(row["state_code"]) or "WB",
                "state_name": clean(row["state_name"]) or "West Bengal",
                "district_code": district_code,
                "name": clean(row["district_name"]) or "Unknown",
            }
        )

    # The geography hierarchy uses source codes as primary keys.
    district_ids = {
        clean(row["district_code"]): clean(row["district_code"])
        for row in districts
    }

    # ------------------------------------------------------------------
    # Subdistricts
    # ------------------------------------------------------------------

    subdistrict_rows: list[dict[str, Any]] = []

    for row in subdistricts:
        if is_empty_geography_row(
            row,
            "subdistrict_code",
            "subdistrict_name",
        ):
            continue

        district_code = clean(row["district_code"])
        subdistrict_code = clean(row["subdistrict_code"])

        subdistrict_rows.append(
            {
                "id": subdistrict_code,
                "district_id": district_ids[district_code],
                "district_code": district_code,
                "name": clean(row["subdistrict_name"]),
                "subdistrict_code": subdistrict_code,
            }
        )

    # ------------------------------------------------------------------
    # Blocks
    # ------------------------------------------------------------------

    block_rows: list[dict[str, Any]] = []

    for row in blocks:
        if is_empty_geography_row(
            row,
            "block_code",
            "block_name",
        ):
            continue

        district_code = clean(row["district_code"])
        block_code = clean(row["block_code"])

        block_rows.append(
            {
                "id": block_code,
                "district_id": district_ids[district_code],
                "district_code": district_code,
                "name": clean(row["block_name"]),
                "block_code": block_code,
            }
        )

    # ------------------------------------------------------------------
    # Local bodies
    # ------------------------------------------------------------------

    local_body_rows: list[dict[str, Any]] = []

    for row in local_bodies:
        if is_empty_geography_row(
            row,
            "localbody_code",
            "localbody_name",
        ):
            continue

        district_code = clean(row["district_code"])
        localbody_code = clean(row["localbody_code"])

        local_body_rows.append(
            {
                "id": localbody_code,
                "district_id": district_ids[district_code],
                "district_code": district_code,
                "name": clean(row["localbody_name"]),
                "localbody_code": localbody_code,
            }
        )

    # ------------------------------------------------------------------
    # Locations
    # ------------------------------------------------------------------

    location_rows: list[dict[str, Any]] = []

    for row in locations:
        district_code = clean(row["district_code"])

        location_rows.append(
            {
                "id": clean(row["location_id"]),
                "state_code": clean(row["state_code"]) or "WB",
                "state_name": clean(row["state_name"]) or "West Bengal",
                "district_id": district_ids[district_code],
                "district_code": district_code,
                "subdistrict_id": clean(row["subdistrict_code"]),
                "subdistrict_code": clean(row["subdistrict_code"]),
                "block_id": clean(row["block_code"]),
                "block_code": clean(row["block_code"]),
                "local_body_id": clean(row["localbody_code"]),
                "localbody_code": clean(row["localbody_code"]),
                "village_code": clean(row["village_code"]),
                "name": clean(row["village_name"]) or "Unknown",
                "village_status": clean(row["village_status"]),
                "census_2011_code": clean(row["census_2011_code"]),
            }
        )

    # ------------------------------------------------------------------
    # Facilities
    # ------------------------------------------------------------------

    facility_rows: list[dict[str, Any]] = []

    for row in facilities:
        lat = float(row["latitude"]) if clean(row["latitude"]) else None
        lon = float(row["longitude"]) if clean(row["longitude"]) else None

        facility_rows.append(
            {
                "id": clean(row["id"]),
                "name": clean(row["name"]) or "Unnamed facility",
                "facility_type": enum_or_none(
                    FacilityType,
                    row["facility_type"],
                ),
                "ownership": clean(row["ownership"]),
                "district": clean(row["district"]),
                "district_mapping_confident": bool_value(
                    row["district_mapping_confident"]
                ),
                "subdistrict": clean(row["subdistrict"]),
                "pincode": clean(row["pincode"]),
                "latitude": lat,
                "longitude": lon,
                "coordinate_status": enum_or_none(
                    CoordinateStatus,
                    row["coordinate_status"],
                ),
                "coordinate_confidence": clean(
                    row["coordinate_confidence"]
                ),
                "coordinate_source": clean(row["coordinate_source"]),
                "source": clean(row["source"]),
                "source_record_id": clean(row["source_record_id"]),
                "verification_status": clean(
                    row["verification_status"]
                ),
                "facility_category": clean(row["facility_category"]),
                "facility_care_type": clean(row["facility_care_type"]),
                "medicine_system": clean(row["medicine_system"]),
                "telephone": clean(row["telephone"]),
                "mobile_number": clean(row["mobile_number"]),
                "emergency_number": clean(row["emergency_number"]),
                "website": clean(row["website"]),
                "specialties_raw": clean(row["specialties_raw"]),
                "service_availability": enum_or_none(
                    AvailabilityLevel,
                    row["service_availability_default"],
                ),
                "diagnostic_availability": enum_or_none(
                    AvailabilityLevel,
                    row["diagnostic_availability_default"],
                ),
                "medicine_availability": enum_or_none(
                    AvailabilityLevel,
                    row["medicine_availability_default"],
                ),
            }
        )

    # ------------------------------------------------------------------
    # Facility services
    # ------------------------------------------------------------------

    now = datetime.now(timezone.utc)
    service_rows: list[dict[str, Any]] = []

    for row in services:
        service_rows.append(
            {
                "id": clean(row["facility_service_id"]),
                "facility_id": clean(row["facility_id"]),
                "service_name": clean(row["service_name"]) or "Unknown",
                "available": bool_value(row["available"]),
                "capacity_status": enum_or_none(
                    CapacityStatus,
                    row["capacity_status"],
                ),
                "last_updated": (
                    dt(row["last_updated"])
                    if clean(row["last_updated"])
                    else now
                ),
            }
        )

    # ------------------------------------------------------------------
    # Database import
    # ------------------------------------------------------------------

    async with AsyncSessionLocal() as db:
        async with db.begin():

            print("Importing districts...")
            await bulk_upsert(db, District, district_rows)

            print("Importing subdistricts...")
            await bulk_upsert(db, Subdistrict, subdistrict_rows)

            print("Importing blocks...")
            await bulk_upsert(db, Block, block_rows)

            print("Importing local bodies...")
            await bulk_upsert(db, LocalBody, local_body_rows)

            print("Importing locations...")
            await bulk_upsert(db, Location, location_rows)

            print("Importing facilities...")
            await bulk_upsert(db, Facility, facility_rows)

            print("Importing facility services...")
            await bulk_upsert(db, FacilityService, service_rows)

    print()
    print("West Bengal master-data import completed successfully.")
    print("=" * 55)
    print(f"  districts:      {len(district_rows):>6}")
    print(f"  subdistricts:   {len(subdistrict_rows):>6}")
    print(f"  blocks:         {len(block_rows):>6}")
    print(f"  local bodies:   {len(local_body_rows):>6}")
    print(f"  locations:      {len(location_rows):>6}")
    print(f"  facilities:     {len(facility_rows):>6}")
    print(f"  services:       {len(service_rows):>6}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    args = parser.parse_args()

    asyncio.run(import_data(args.data_dir))


if __name__ == "__main__":
    main()
