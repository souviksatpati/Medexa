"""
Loads the West Bengal Ultimate Data Package into Medexa's database.
Run after migrations, in this order (per the package README):
  geography -> facilities -> synthetic operational data

    python -m scripts.seed_wb_data

Expects the cleaned CSVs (produced from Medexa_West_Bengal_Ultimate_
Data_Package.zip) at data/wb_final/ relative to the backend root —
adjust DATA_DIR below if you place them elsewhere.
"""
import asyncio
import csv
from datetime import datetime, timezone
from pathlib import Path

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.facility import Facility, FacilityType, AvailabilityLevel, CoordinateStatus
from app.models.facility_service import FacilityService, CapacityStatus
from app.models.patient import Patient, Sex
from app.models.care_episode import CareEpisode, CareEpisodeStatus
from app.models.observation import TriageAssessment, ClinicalRiskLevel
from app.models.referral import Referral, ReferralState, ReferralStateTransition
from app.models.continuity import ReferralSla
from app.services.sla_engine import compute_initial_sla_due_dates

DATA_DIR = Path(__file__).parent.parent / "data" / "wb_final"


def _read_csv(name: str) -> list[dict]:
    path = DATA_DIR / name
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _parse_float(val: str | None) -> float | None:
    if val is None or val == "":
        return None
    try:
        return float(val)
    except ValueError:
        return None


def _parse_dt(val: str | None) -> datetime | None:
    if not val:
        return None
    dt = datetime.fromisoformat(val)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


async def seed_facilities(db):
    rows = _read_csv("medexa_facilities.csv")
    count = 0
    for row in rows:
        lat = _parse_float(row.get("latitude"))
        lon = _parse_float(row.get("longitude"))
        facility_type_raw = row.get("facility_type") or None

        facility = Facility(
            id=row["id"],
            name=row["name"],
            facility_type=FacilityType(facility_type_raw) if facility_type_raw else None,
            district=row.get("district") or None,
            district_mapping_confident=row.get("district_mapping_confident") == "True",
            subdistrict=row.get("subdistrict") or None,
            pincode=row.get("pincode") or None,
            latitude=lat,
            longitude=lon,
            coordinate_status=(
                CoordinateStatus.PRESENT if lat is not None and lon is not None
                else CoordinateStatus.MISSING_OR_INVALID
            ),
            coordinate_source=row.get("coordinate_source") or None,
            coordinate_confidence=row.get("coordinate_confidence") or None,
            source=row.get("source") or None,
            source_record_id=row.get("source_record_id") or None,
            verification_status=row.get("verification_status") or None,
            facility_category=row.get("facility_category") or None,
            facility_care_type=row.get("facility_care_type") or None,
            medicine_system=row.get("medicine_system") or None,
            telephone=row.get("telephone") or None,
            mobile_number=row.get("mobile_number") or None,
            emergency_number=row.get("emergency_number") or None,
            website=row.get("website") or None,
            specialties_raw=row.get("specialties_raw") or None,
            service_availability=AvailabilityLevel.AVAILABLE,
            diagnostic_availability=(
                AvailabilityLevel.UNAVAILABLE if facility_type_raw == "sub_centre"
                else AvailabilityLevel.AVAILABLE
            ),
            medicine_availability=AvailabilityLevel.AVAILABLE,
        )
        db.add(facility)
        count += 1
        if count % 1000 == 0:
            await db.flush()
            print(f"  ...{count} facilities staged")
    await db.flush()
    print(f"Seeded {count:,} facilities")


async def seed_users(db):
    """Real facility-backed demo users so RBAC + facility linkage is
    demonstrable against real South 24 Parganas facilities, not
    fictional ones."""
    fac_mapping = _read_csv("../wb_ultimate/operational_demo/medexa_synthetic_facility_mapping.csv")
    sub_centre_like = fac_mapping[0]  # Diamond Harbour DH per the package's own mapping

    users = [
        User(
            id="demo-asha-001", username="asha.demo",
            hashed_password=hash_password("demo1234"),
            full_name="Sunita Devi (ASHA Worker)", role=UserRole.ASHA_WORKER,
            facility_id=fac_mapping[2]["real_facility_id"],  # a CHC-tier facility
        ),
        User(
            id="demo-doctor-001", username="doctor.demo",
            hashed_password=hash_password("demo1234"),
            full_name="Dr. Rakesh Verma", role=UserRole.DOCTOR,
            facility_id=fac_mapping[6]["real_facility_id"],  # a PHC
        ),
        User(
            id="demo-officer-001", username="officer.demo",
            hashed_password=hash_password("demo1234"),
            full_name="Anita Sharma (District Health Officer)", role=UserRole.DISTRICT_OFFICER,
            facility_id=sub_centre_like["real_facility_id"],  # district hospital
        ),
    ]
    db.add_all(users)
    await db.flush()
    print("Seeded 3 demo users (asha.demo / doctor.demo / officer.demo, password: demo1234)")


async def seed_synthetic_operational_data(db):
    patients = _read_csv("medexa_synthetic_patients.csv")
    for row in patients:
        db.add(Patient(
            id=row["patient_id"], full_name=row["full_name"],
            age=int(row["age"]), sex=Sex(row["sex"]),
            village_or_ward=row["village_or_ward"],
            chronic_conditions=[],
        ))
    await db.flush()
    print(f"Seeded {len(patients)} synthetic patients (linked to real LGD villages)")

    episodes = _read_csv("medexa_synthetic_care_episodes.csv")
    for row in episodes:
        db.add(CareEpisode(
            id=row["care_episode_id"], patient_id=row["patient_id"],
            status=CareEpisodeStatus.OPEN if row["status"] == "ACTIVE" else CareEpisodeStatus.CLOSED,
            opened_at=_parse_dt(row["started_at"]),
            closed_at=_parse_dt(row.get("ended_at")),
        ))
    await db.flush()
    print(f"Seeded {len(episodes)} synthetic care episodes")

    triage_rows = _read_csv("medexa_synthetic_triage.csv")
    risk_map = {"LOW": ClinicalRiskLevel.LOW, "MEDIUM": ClinicalRiskLevel.MODERATE,
                "HIGH": ClinicalRiskLevel.HIGH, "CRITICAL": ClinicalRiskLevel.EMERGENCY}
    for row in triage_rows:
        db.add(TriageAssessment(
            id=row["triage_assessment_id"], care_episode_id=row["care_episode_id"],
            symptoms=[s.strip() for s in row["symptoms"].split(",")],
            clinical_risk_level=risk_map.get(row["clinical_risk_level"], ClinicalRiskLevel.LOW),
            performed_by="demo-asha-001",
            performed_at=_parse_dt(row["assessment_time"]),
            sync_status="synced",
        ))
    await db.flush()
    print(f"Seeded {len(triage_rows)} synthetic triage assessments")

    referrals = _read_csv("medexa_synthetic_referrals.csv")
    for row in referrals:
        referral = Referral(
            id=row["referral_id"], care_episode_id=row["care_episode_id"],
            patient_id=row["patient_id"],
            from_facility_id=row["from_facility_id"], to_facility_id=row["to_facility_id"],
            current_state=ReferralState(row["current_state_final"]),
            reason=row["reason"], created_by="demo-asha-001",
            sync_status="synced",
        )
        db.add(referral)
        created_at = _parse_dt(row["created_at"])
        sla_dates = compute_initial_sla_due_dates(created_at)
        db.add(ReferralSla(referral_id=referral.id, **sla_dates))
    await db.flush()
    print(f"Seeded {len(referrals)} synthetic referrals with SLA rows")

    transitions = _read_csv("medexa_synthetic_referral_transitions.csv")
    for row in transitions:
        db.add(ReferralStateTransition(
            referral_id=row["referral_id"],
            from_state=ReferralState(row["from_state_final"]) if row.get("from_state_final") else None,
            to_state=ReferralState(row["to_state_final"]),
            changed_by="demo-asha-001",
            changed_at=_parse_dt(row["transitioned_at"]),
            note=row.get("note"),
        ))
    await db.flush()
    print(f"Seeded {len(transitions)} synthetic referral transitions")

    services = _read_csv("medexa_synthetic_facility_services.csv")
    for row in services:
        db.add(FacilityService(
            id=row["facility_service_id"], facility_id=row["facility_id"],
            service_name=row["service_name"],
            available=row["available"].lower() == "true",
            capacity_status=CapacityStatus(row["capacity_status"].lower()),
            last_updated=_parse_dt(row["last_updated"]),
        ))
    await db.flush()
    print(f"Seeded {len(services)} synthetic facility service records")


async def seed():
    async with AsyncSessionLocal() as db:
        print("=== Geography + facilities (real data) ===")
        await seed_facilities(db)
        await seed_users(db)
        print()
        print("=== Synthetic operational demo data (linked to real geography/facilities) ===")
        await seed_synthetic_operational_data(db)
        await db.commit()
        print()
        print("Done. Demo logins: asha.demo / doctor.demo / officer.demo, password: demo1234")


if __name__ == "__main__":
    asyncio.run(seed())
