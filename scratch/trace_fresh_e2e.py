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
from app.models.continuity import ReferralSla, FollowUpTask
from app.models.facility import Facility
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        print("=" * 80)
        print("PHASE 1: TRACING FRESH E2E RECORD IN POSTGRESQL")
        print("=" * 80)
        
        # Query patient
        res_p = await db.execute(select(Patient).where(Patient.id == '8fdccb8c-ab56-4596-9d9b-9d5daa04ae41'))
        patient = res_p.scalar_one_or_none()
        if not patient:
            res_p = await db.execute(select(Patient).where(Patient.full_name.ilike('%Fresh%')))
            patient = res_p.scalars().first()
            
        print("PATIENT RECORD:")
        if patient:
            print(f"  ID: {patient.id}")
            print(f"  Name: {patient.full_name}")
            print(f"  Age: {patient.age}, Sex: {patient.sex}")
            print(f"  Village/Ward: {patient.village_or_ward}")
            print(f"  Phone: {patient.phone}")
            print(f"  Created At: {patient.created_at}")
        else:
            print("  NOT FOUND!")

        if patient:
            # Query care episodes
            res_ep = await db.execute(select(CareEpisode).where(CareEpisode.patient_id == patient.id))
            episodes = res_ep.scalars().all()
            print(f"\nCARE EPISODES ({len(episodes)}):")
            for ep in episodes:
                print(f"  ID: {ep.id}, Status: {ep.status}, Opened At: {ep.opened_at}")

            ep_ids = [ep.id for ep in episodes]
            if ep_ids:
                # Query triage assessments
                res_tr = await db.execute(select(TriageAssessment).where(TriageAssessment.care_episode_id.in_(ep_ids)))
                triages = res_tr.scalars().all()
                print(f"\nTRIAGE ASSESSMENTS ({len(triages)}):")
                for tr in triages:
                    print(f"  ID: {tr.id}, Episode ID: {tr.care_episode_id}, Symptoms: {tr.symptoms}, Risk: {tr.clinical_risk_level}, Time: {tr.performed_at}")

                # Query referrals
                res_ref = await db.execute(select(Referral).where(Referral.patient_id == patient.id))
                referrals = res_ref.scalars().all()
                print(f"\nREFERRALS ({len(referrals)}):")
                for r in referrals:
                    print(f"  ID: {r.id}")
                    print(f"  Patient ID: {r.patient_id}")
                    print(f"  Care Episode ID: {r.care_episode_id}")
                    print(f"  From Facility ID: {r.from_facility_id}")
                    print(f"  To Facility ID: {r.to_facility_id}")
                    print(f"  Current State: {r.current_state}")
                    print(f"  Priority: {r.priority}")
                    print(f"  Reason: {r.reason}")
                    print(f"  Created By: {r.created_by}")
                    print(f"  Created At: {r.created_at}")
        
        # Also check if referral dcf65786... exists directly
        res_r_direct = await db.execute(select(Referral).where(Referral.id.ilike('dcf65786%')))
        r_direct = res_r_direct.scalar_one_or_none()
        print("\nDIRECT REFERRAL LOOKUP (dcf65786...):")
        if r_direct:
            print(f"  ID: {r_direct.id}, Patient: {r_direct.patient_id}, To Facility: {r_direct.to_facility_id}, State: {r_direct.current_state}")
        else:
            print("  NOT FOUND BY ID DIRECTLY!")

        # Facility details for MED-WB-FAC-000345
        print("\nPHASE 5: FACILITY DETAILS (MED-WB-FAC-000345):")
        res_fac = await db.execute(select(Facility).where(Facility.id == 'MED-WB-FAC-000345'))
        fac = res_fac.scalar_one_or_none()
        if fac:
            print(f"  ID: {fac.id}")
            print(f"  Name: {fac.name}")
            print(f"  Type: {fac.facility_type}")
            print(f"  District: {fac.district}")
            print(f"  Subdistrict/Block: {fac.subdistrict}")
            print(f"  Village/Ward: {fac.village_or_ward}")
        else:
            print("  FACILITY MED-WB-FAC-000345 NOT FOUND!")

if __name__ == "__main__":
    asyncio.run(main())
