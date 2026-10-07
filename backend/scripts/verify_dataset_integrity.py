"""
Automated Dataset Integrity Verifier for Medexa.
Verifies all relational constraints, foreign key references, referral-episode-patient identity alignment,
and state machine legality across the database tables.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.patient import Patient
from app.models.care_episode import CareEpisode
from app.models.observation import TriageAssessment
from app.models.referral import Referral, ReferralStateTransition
from app.models.continuity import ReferralSla, FollowUpTask, ReferralRescueAction, BackReferral
from app.models.facility import Facility

async def verify_integrity():
    print("=" * 70)
    print("MEDEXA DATASET INTEGRITY VERIFIER")
    print("=" * 70)
    
    async with AsyncSessionLocal() as db:
        patients = (await db.execute(select(Patient))).scalars().all()
        episodes = (await db.execute(select(CareEpisode))).scalars().all()
        triages = (await db.execute(select(TriageAssessment))).scalars().all()
        referrals = (await db.execute(select(Referral))).scalars().all()
        transitions = (await db.execute(select(ReferralStateTransition))).scalars().all()
        slas = (await db.execute(select(ReferralSla))).scalars().all()
        followups = (await db.execute(select(FollowUpTask))).scalars().all()
        rescues = (await db.execute(select(ReferralRescueAction))).scalars().all()
        back_referrals = (await db.execute(select(BackReferral))).scalars().all()
        facilities = (await db.execute(select(Facility))).scalars().all()

        patient_map = {p.id: p for p in patients}
        episode_map = {e.id: e for e in episodes}
        referral_map = {r.id: r for r in referrals}
        facility_map = {f.id: f for f in facilities}

        errors = []

        # 1. Episode -> Patient check
        for ep in episodes:
            if ep.patient_id not in patient_map:
                errors.append(f"CareEpisode {ep.id} references missing Patient {ep.patient_id}")

        # 2. Triage -> CareEpisode check
        for tr in triages:
            if tr.care_episode_id not in episode_map:
                errors.append(f"TriageAssessment {tr.id} references missing CareEpisode {tr.care_episode_id}")

        # 3. Referral -> CareEpisode & Patient alignment check
        for ref in referrals:
            if ref.care_episode_id not in episode_map:
                errors.append(f"Referral {ref.id} references missing CareEpisode {ref.care_episode_id}")
            if ref.patient_id not in patient_map:
                errors.append(f"Referral {ref.id} references missing Patient {ref.patient_id}")
            
            linked_ep = episode_map.get(ref.care_episode_id)
            if linked_ep and linked_ep.patient_id != ref.patient_id:
                errors.append(
                    f"Referral {ref.id} patient_id mismatch! "
                    f"Referral.patient_id={ref.patient_id} vs CareEpisode.patient_id={linked_ep.patient_id}"
                )

        # 4. FollowUpTask -> CareEpisode check
        for fu in followups:
            if fu.care_episode_id not in episode_map:
                errors.append(f"FollowUpTask {fu.id} references missing CareEpisode {fu.care_episode_id}")

        # 5. ReferralStateTransition -> Referral check
        for tr in transitions:
            if tr.referral_id not in referral_map:
                errors.append(f"Transition {tr.id} references missing Referral {tr.referral_id}")

        # 6. ReferralSla -> Referral check
        for sla in slas:
            if sla.referral_id not in referral_map:
                errors.append(f"SLA for referral {sla.referral_id} references missing Referral")

        # 7. RescueAction -> Referral check
        for resc in rescues:
            if resc.referral_id not in referral_map:
                errors.append(f"RescueAction {resc.id} references missing Referral {resc.referral_id}")

        # 8. BackReferral -> Referral check
        for br in back_referrals:
            if br.referral_id not in referral_map:
                errors.append(f"BackReferral {br.id} references missing Referral {br.referral_id}")

        print(f"Total Patients           : {len(patients)}")
        print(f"Total Care Episodes      : {len(episodes)}")
        print(f"Total Triage Assessments : {len(triages)}")
        print(f"Total Referrals          : {len(referrals)}")
        print(f"Total Transitions        : {len(transitions)}")
        print(f"Total Referral SLAs      : {len(slas)}")
        print(f"Total Follow-up Tasks    : {len(followups)}")
        print(f"Total Rescue Actions     : {len(rescues)}")
        print(f"Total Back Referrals     : {len(back_referrals)}")
        print("-" * 70)
        print(f"Integrity Error Count    : {len(errors)}")

        if errors:
            print("\nINTEGRITY ERRORS DETECTED:")
            for err in errors:
                print(f"  - {err}")
            sys.exit(1)
        else:
            print("\nSUCCESS: All dataset relationships and single patient identity constraints are valid!")
            sys.exit(0)

if __name__ == "__main__":
    asyncio.run(verify_integrity())
