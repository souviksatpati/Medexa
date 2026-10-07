"""Validate the Medexa West Bengal master/demo dataset before import.

Usage:
    python -m scripts.validate_wb_data --data-dir ../datasets/wb_final

The validator is deliberately dependency-light: it uses Python's csv module
so it can run before application dependencies or database access are needed.
It never mutates the database.
"""
from __future__ import annotations

import argparse
import csv
import math
from pathlib import Path

EXPECTED = {
    "medexa_districts.csv": ["state_code", "state_name", "district_code", "district_name"],
    "medexa_subdistricts.csv": ["district_code", "district_name", "subdistrict_code", "subdistrict_name"],
    "medexa_blocks.csv": ["district_code", "district_name", "block_code", "block_name"],
    "medexa_local_bodies.csv": ["district_code", "district_name", "localbody_code", "localbody_name"],
    "medexa_locations.csv": [
        "location_id", "state_code", "state_name", "district_code", "district_name",
        "subdistrict_code", "subdistrict_name", "block_code", "block_name",
        "localbody_code", "localbody_name", "village_code", "village_name",
        "village_status", "census_2011_code",
    ],
    "medexa_facilities.csv": [
        "id", "name", "facility_type", "ownership", "district",
        "district_mapping_confident", "subdistrict", "pincode", "latitude", "longitude",
        "coordinate_status", "coordinate_confidence", "coordinate_source", "source",
        "source_record_id", "verification_status", "facility_category", "facility_care_type",
        "medicine_system", "telephone", "mobile_number", "emergency_number", "website",
        "specialties_raw", "service_availability_default", "diagnostic_availability_default",
        "medicine_availability_default",
    ],
}
FACILITY_TYPES = {"sub_centre", "phc", "chc", "rural_hospital", "state_hospital", "district_hospital"}
AVAILABILITY = {"available", "limited", "unavailable"}
CAPACITY = {"available", "limited", "full", "unknown"}
COORD_STATUS = {"present", "missing_in_supplied_source", "missing_or_invalid"}
GEOGRAPHY_KEYS = {
    "subdistricts": ("subdistrict_code", "subdistrict_name"),
    "blocks": ("block_code", "block_name"),
    "local bodies": ("localbody_code", "localbody_name"),
}


def rows(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames is None:
            raise ValueError(f"{path.name}: missing CSV header")
        expected = EXPECTED.get(path.name)
        if expected:
            missing = [c for c in expected if c not in reader.fieldnames]
            if missing:
                raise ValueError(f"{path.name}: missing columns: {', '.join(missing)}")
        yield from reader


def norm(v: str | None) -> str:
    return (v or "").strip()


def is_empty_geography_row(row: dict[str, str], code_key: str, name_key: str) -> bool:
    return not norm(row.get(code_key)) and not norm(row.get(name_key))


def unique(
    rows_,
    key: str,
    label: str,
    errors: list[str],
    skipped: dict[str, int] | None = None,
    name_key: str | None = None,
):
    seen: set[str] = set()

    for n, row in enumerate(rows_, 2):
        value = norm(row.get(key))
        name = norm(row.get(name_key)) if name_key else ""

        # A completely empty geography record is a source gap, not an entity.
        if name_key and not value and not name:
            if skipped is not None:
                skipped[label] = skipped.get(label, 0) + 1
            continue

        # Geography entities require both their canonical code and name.
        if name_key:
            if not value:
                errors.append(f"{label}: row {n} has empty {key}")
                continue
            if not name:
                errors.append(f"{label}: row {n} has empty {name_key}")
                continue

        elif not value:
            errors.append(f"{label}: row {n} has empty {key}")
            continue

        if value in seen:
            errors.append(f"{label}: duplicate {key}={value!r} at row {n}")

        seen.add(value)

    return seen


def validate(data_dir: Path) -> int:
    errors: list[str] = []
    warnings: list[str] = []
    skipped: dict[str, int] = {}
    loaded: dict[str, list[dict[str, str]]] = {}

    for filename in EXPECTED:
        path = data_dir / filename
        if not path.exists():
            errors.append(f"missing required file: {filename}")
            continue
        try:
            loaded[filename] = list(rows(path))
        except Exception as exc:
            errors.append(str(exc))

    if errors:
        return report(loaded, errors, warnings, skipped)

    districts = unique(loaded["medexa_districts.csv"], "district_code", "districts", errors)
    subdistricts = unique(loaded["medexa_subdistricts.csv"], "subdistrict_code", "subdistricts", errors, skipped, "subdistrict_name")
    blocks = unique(loaded["medexa_blocks.csv"], "block_code", "blocks", errors, skipped, "block_name")
    localbodies = unique(loaded["medexa_local_bodies.csv"], "localbody_code", "local bodies", errors, skipped, "localbody_name")
    facilities = unique(loaded["medexa_facilities.csv"], "id", "facilities", errors)
    unique(loaded["medexa_locations.csv"], "location_id", "locations", errors)

    for label, data, key in [
        ("subdistricts", loaded["medexa_subdistricts.csv"], "district_code"),
        ("blocks", loaded["medexa_blocks.csv"], "district_code"),
        ("local bodies", loaded["medexa_local_bodies.csv"], "district_code"),
        ("locations", loaded["medexa_locations.csv"], "district_code"),
    ]:
        for n, row in enumerate(data, 2):
            if label in GEOGRAPHY_KEYS:
                code_key, name_key = GEOGRAPHY_KEYS[label]
                if is_empty_geography_row(row, code_key, name_key):
                    continue
            if norm(row.get(key)) not in districts:
                errors.append(f"{label}: row {n} references unknown district_code={row.get(key)!r}")

    for n, row in enumerate(loaded["medexa_locations.csv"], 2):
        for key, known in [
            ("subdistrict_code", subdistricts),
            ("block_code", blocks),
            ("localbody_code", localbodies),
        ]:
            value = norm(row.get(key))
            if value and value not in known:
                errors.append(f"locations: row {n} references unknown {key}={value!r}")

    for n, row in enumerate(loaded["medexa_facilities.csv"], 2):
        ftype = norm(row.get("facility_type")).lower()
        if ftype and ftype not in FACILITY_TYPES:
            errors.append(f"facilities: row {n} unknown facility_type={ftype!r}")
        coord_status = norm(row.get("coordinate_status")).lower()
        if coord_status not in COORD_STATUS:
            errors.append(f"facilities: row {n} unknown coordinate_status={row.get('coordinate_status')!r}")
        lat, lon = norm(row.get("latitude")), norm(row.get("longitude"))
        if coord_status == "present":
            try:
                lat_f, lon_f = float(lat), float(lon)
                if not (-90 <= lat_f <= 90 and -180 <= lon_f <= 180):
                    errors.append(f"facilities: row {n} has out-of-range coordinates")
                if not (math.isfinite(lat_f) and math.isfinite(lon_f)):
                    errors.append(f"facilities: row {n} has non-finite coordinates")
            except ValueError:
                errors.append(f"facilities: row {n} marked PRESENT but coordinates are not numeric")
        elif lat or lon:
            warnings.append(
                f"facilities: row {n} has partial coordinates while "
                f"coordinate_status={coord_status}"
            )
        for key in ("service_availability_default", "diagnostic_availability_default", "medicine_availability_default"):
            value = norm(row.get(key)).lower()
            if value not in AVAILABILITY:
                errors.append(f"facilities: row {n} unknown {key}={value!r}")

    service_file = data_dir / "medexa_synthetic_facility_services.csv"
    if service_file.exists():
        services = list(rows(service_file))
        unique(services, "facility_service_id", "facility services", errors)
        seen_pairs: set[tuple[str, str]] = set()
        for n, row in enumerate(services, 2):
            fid, name = norm(row.get("facility_id")), norm(row.get("service_name"))
            if fid not in facilities:
                errors.append(f"facility services: row {n} unknown facility_id={fid!r}")
            pair = (fid, name.casefold())
            if pair in seen_pairs:
                errors.append(f"facility services: duplicate facility/service pair at row {n}")
            seen_pairs.add(pair)
            value = norm(row.get("capacity_status")).lower()
            if value not in CAPACITY:
                errors.append(f"facility services: row {n} unknown capacity_status={row.get('capacity_status')!r}")

    return report(loaded, errors, warnings, skipped)


def report(loaded, errors, warnings, skipped) -> int:
    print("West Bengal Dataset Validation")
    print("=" * 48)
    for filename, data in loaded.items():
        print(f"{filename:<44} {len(data):>7}")
    print("-" * 48)
    if skipped:
        print("Skipped completely empty source rows")
        for label, count in skipped.items():
            print(f"  {label:<38} {count:>7}")
        print("-" * 48)
    print(f"Warnings                                  {len(warnings):>7}")
    print(f"Errors                                    {len(errors):>7}")
    if warnings:
        print("\nWARNINGS")
        for item in warnings[:25]:
            print(f"  - {item}")
        if len(warnings) > 25:
            print(f"  ... {len(warnings) - 25} more")
    if errors:
        print("\nERRORS")
        for item in errors[:50]:
            print(f"  - {item}")
        if len(errors) > 50:
            print(f"  ... {len(errors) - 50} more")
        print("\nRESULT: FAIL")
        return 1
    print("RESULT: PASS")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    args = parser.parse_args()
    raise SystemExit(validate(args.data_dir))
