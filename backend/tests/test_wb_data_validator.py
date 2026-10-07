import csv
from pathlib import Path

from scripts.validate_wb_data import validate


FILES = {
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
        "id", "name", "facility_type", "ownership", "district", "district_mapping_confident",
        "subdistrict", "pincode", "latitude", "longitude", "coordinate_status",
        "coordinate_confidence", "coordinate_source", "source", "source_record_id",
        "verification_status", "facility_category", "facility_care_type", "medicine_system",
        "telephone", "mobile_number", "emergency_number", "website", "specialties_raw",
        "service_availability_default", "diagnostic_availability_default",
        "medicine_availability_default",
    ],
}


def make_fixture(tmp_path: Path) -> Path:
    data = tmp_path / "data"
    data.mkdir()
    rows = {
        "medexa_districts.csv": [{"state_code": "19", "state_name": "West Bengal", "district_code": "315", "district_name": "KOLKATA"}],
        "medexa_subdistricts.csv": [{"district_code": "315", "district_name": "KOLKATA", "subdistrict_code": "SD-1", "subdistrict_name": "Central"}],
        "medexa_blocks.csv": [{"district_code": "315", "district_name": "KOLKATA", "block_code": "BL-1", "block_name": "Central Block"}],
        "medexa_local_bodies.csv": [{"district_code": "315", "district_name": "KOLKATA", "localbody_code": "LB-1", "localbody_name": "Central Municipality"}],
        "medexa_locations.csv": [{
            "location_id": "LOC-1", "state_code": "19", "state_name": "West Bengal", "district_code": "315", "district_name": "KOLKATA",
            "subdistrict_code": "SD-1", "subdistrict_name": "Central", "block_code": "BL-1", "block_name": "Central Block",
            "localbody_code": "LB-1", "localbody_name": "Central Municipality", "village_code": "V-1", "village_name": "Test Village",
            "village_status": "Rural", "census_2011_code": "C-1",
        }],
    }
    facilities = []
    for idx, status in enumerate(["PRESENT", "MISSING_IN_SUPPLIED_SOURCE", "MISSING_OR_INVALID"], 1):
        facilities.append({
            "id": f"FAC-{idx}", "name": f"Test Facility {idx}", "facility_type": "phc", "ownership": "public",
            "district": "KOLKATA", "district_mapping_confident": "true", "subdistrict": "Central", "pincode": "700001",
            "latitude": "22.57" if status == "PRESENT" else "", "longitude": "88.36" if status == "PRESENT" else "",
            "coordinate_status": status, "coordinate_confidence": "high", "coordinate_source": "test", "source": "test",
            "source_record_id": f"SRC-{idx}", "verification_status": "verified", "facility_category": "public",
            "facility_care_type": "primary", "medicine_system": "allopathic", "telephone": "", "mobile_number": "",
            "emergency_number": "", "website": "", "specialties_raw": "", "service_availability_default": "available",
            "diagnostic_availability_default": "available", "medicine_availability_default": "available",
        })
    rows["medexa_facilities.csv"] = facilities
    for filename, values in rows.items():
        with (data / filename).open("w", encoding="utf-8", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=FILES[filename])
            writer.writeheader()
            writer.writerows(values)
    return data


def test_coordinate_status_accepts_all_canonical_values(tmp_path):
    assert validate(make_fixture(tmp_path)) == 0


def test_empty_geography_rows_are_non_fatal(tmp_path):
    fixture = make_fixture(tmp_path)
    path = fixture / "medexa_subdistricts.csv"
    with path.open("a", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FILES[path.name])
        writer.writerow({"district_code": "315", "district_name": "KOLKATA", "subdistrict_code": "", "subdistrict_name": ""})
    assert validate(fixture) == 0


def test_partially_empty_geography_row_is_still_an_error(tmp_path):
    fixture = make_fixture(tmp_path)
    path = fixture / "medexa_subdistricts.csv"
    with path.open("a", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FILES[path.name])
        writer.writerow({"district_code": "315", "district_name": "KOLKATA", "subdistrict_code": "SYNTHETIC-BAD-001", "subdistrict_name": ""})
    assert validate(fixture) == 1
