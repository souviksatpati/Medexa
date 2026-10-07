"""
Seeds enough data to run the full demo without waiting on a real Synthea
import pipeline. Run after migrations:

    python -m scripts.seed_demo_data

This seeds:
- Three users, one per role, so RBAC is demonstrable immediately
- A small facility network for one pilot region (sub-centre -> PHC ->
  district hospital), matching the "strengthening the existing chain"
  thesis rather than inventing a fictional network structure
- Coordinates real enough for the haversine pathway-ranking to behave
  sensibly in a demo
- One demo patient with an open Care Episode
- One referral DELIBERATELY created with a past timestamp, so its
  acknowledgement SLA is already breached — this means the Rescue Engine
  has something real to demonstrate the moment you load the dashboard,
  rather than requiring you to wait hours for a live SLA to expire

Swap the facility/patient data for a real Synthea + Health Facility
Registry import once Phase 2 is underway — this script is a bootstrap,
not the final data source.
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.facility import Facility, FacilityType, AvailabilityLevel
from app.models.patient import Patient, Sex
from app.models.care_episode import CareEpisode, CareEpisodeStatus
from app.models.observation import TriageAssessment, ClinicalRiskLevel
from app.models.referral import Referral, ReferralState, ReferralStateTransition
from app.models.continuity import ReferralSla
from app.services.sla_engine import compute_initial_sla_due_dates


async def seed():
    async with AsyncSessionLocal() as db:
        sub_centre = Facility(
            id="facility-subcentre-demo",
            name="Sub-Centre Devgadh",
            facility_type=FacilityType.SUB_CENTRE,
            district="Demo District",
            village_or_ward="Devgadh",
            latitude=19.0821,
            longitude=74.1234,
            service_availability=AvailabilityLevel.AVAILABLE,
            diagnostic_availability=AvailabilityLevel.UNAVAILABLE,
            medicine_availability=AvailabilityLevel.LIMITED,
        )
        phc = Facility(
            id=str(uuid.uuid4()),
            name="PHC Devgadh Block",
            facility_type=FacilityType.PHC,
            district="Demo District",
            village_or_ward="Devgadh Block HQ",
            latitude=19.1050,
            longitude=74.1500,
            service_availability=AvailabilityLevel.AVAILABLE,
            diagnostic_availability=AvailabilityLevel.LIMITED,
            medicine_availability=AvailabilityLevel.AVAILABLE,
        )
        rural_hospital = Facility(
            id=str(uuid.uuid4()),
            name="Rural Hospital Chandpur",
            facility_type=FacilityType.RURAL_HOSPITAL,
            district="Demo District",
            village_or_ward="Chandpur",
            latitude=19.1500,
            longitude=74.2100,
            service_availability=AvailabilityLevel.AVAILABLE,
            diagnostic_availability=AvailabilityLevel.AVAILABLE,
            medicine_availability=AvailabilityLevel.AVAILABLE,
        )
        district_hospital = Facility(
            id=str(uuid.uuid4()),
            name="District Hospital Headquarters",
            facility_type=FacilityType.DISTRICT_HOSPITAL,
            district="Demo District",
            village_or_ward="District HQ",
            latitude=19.2000,
            longitude=74.3000,
            service_availability=AvailabilityLevel.AVAILABLE,
            diagnostic_availability=AvailabilityLevel.AVAILABLE,
            medicine_availability=AvailabilityLevel.AVAILABLE,
        )

        db.add_all([sub_centre, phc, rural_hospital, district_hospital])

        asha_worker = User(
            id=str(uuid.uuid4()),
            username="asha.demo",
            hashed_password=hash_password("demo1234"),
            full_name="Sunita Devi (ASHA Worker)",
            role=UserRole.ASHA_WORKER,
            facility_id=sub_centre.id,
        )
        doctor = User(
            id=str(uuid.uuid4()),
            username="doctor.demo",
            hashed_password=hash_password("demo1234"),
            full_name="Dr. Rakesh Verma",
            role=UserRole.DOCTOR,
            facility_id=phc.id,
        )
        district_officer = User(
            id=str(uuid.uuid4()),
            username="officer.demo",
            hashed_password=hash_password("demo1234"),
            full_name="Anita Sharma (District Health Officer)",
            role=UserRole.DISTRICT_OFFICER,
            facility_id=district_hospital.id,
        )

        db.add_all([asha_worker, doctor, district_officer])
        await db.flush()  # so facility/user ids are usable below without a commit yet

        # --- Demo patient + Care Episode + breached-SLA referral ---
        # Created 10 hours in the past with a 6-hour acknowledgement SLA
        # (see .env.example's SLA_ACKNOWLEDGEMENT_HOURS default), so this
        # referral is already breached the moment you load the dashboard
        # or open it in the frontend — the Rescue Engine will fire on
        # first read via GET /referrals/{id}, no waiting required.
        created_at = datetime.now(timezone.utc) - timedelta(hours=10)

        patient = Patient(
            id=str(uuid.uuid4()),
            full_name="Lakshmi Bai",
            age=52,
            sex=Sex.FEMALE,
            village_or_ward="Devgadh",
            phone="9876543210",
            chronic_conditions=["hypertension"],
        )
        db.add(patient)
        await db.flush()

        episode = CareEpisode(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            status=CareEpisodeStatus.OPEN,
            opened_at=created_at,
        )
        db.add(episode)
        await db.flush()

        triage = TriageAssessment(
            id=str(uuid.uuid4()),
            care_episode_id=episode.id,
            symptoms=["breathlessness", "high fever"],
            vitals={"systolicBP": 165, "spo2": 90, "tempC": 39.5},
            clinical_risk_level=ClinicalRiskLevel.HIGH,
            performed_by=asha_worker.id,
            performed_at=created_at,
            sync_status="synced",
        )
        db.add(triage)

        referral = Referral(
            id=str(uuid.uuid4()),
            care_episode_id=episode.id,
            patient_id=patient.id,
            from_facility_id=sub_centre.id,
            to_facility_id=phc.id,
            current_state=ReferralState.SENT,
            reason="High-risk triage: breathlessness, high fever, low SpO2",
            created_by=asha_worker.id,
            sync_status="synced",
        )
        db.add(referral)
        await db.flush()

        db.add_all(
            [
                ReferralStateTransition(
                    referral_id=referral.id,
                    from_state=None,
                    to_state=ReferralState.DRAFT,
                    changed_by=asha_worker.id,
                    changed_at=created_at,
                ),
                ReferralStateTransition(
                    referral_id=referral.id,
                    from_state=ReferralState.DRAFT,
                    to_state=ReferralState.SENT,
                    changed_by=asha_worker.id,
                    changed_at=created_at,
                ),
            ]
        )

        sla_dates = compute_initial_sla_due_dates(created_at)
        db.add(ReferralSla(referral_id=referral.id, **sla_dates))

        await db.commit()

        print("Seeded 4 facilities, 3 demo users, 1 demo patient, and 1 breached-SLA referral:")
        print("  asha.demo / demo1234")
        print("  doctor.demo / demo1234")
        print("  officer.demo / demo1234")
        print(f"  Sub-centre id (use as fromFacilityId in frontend demo): {sub_centre.id}")
        print(f"  Demo patient care_episode_id: {episode.id}")
        print(f"  Demo referral id (already SLA-breached — GET it to trigger Rescue): {referral.id}")


if __name__ == "__main__":
    asyncio.run(seed())
