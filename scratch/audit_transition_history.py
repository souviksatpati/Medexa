import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.referral import Referral, ReferralStateTransition
from app.models.facility import Facility

async def main():
    async with AsyncSessionLocal() as db:
        res_facs = await db.execute(select(Facility))
        fac_map = {f.id: f for f in res_facs.scalars().all()}

        res = await db.execute(
            select(Referral)
            .options(selectinload(Referral.transitions))
            .where(Referral.to_facility_id == "MED-WB-FAC-000349")
        )
        district_referrals = res.scalars().all()

        print("=" * 80)
        print(f"TRANSITION HISTORY AUDIT FOR DISTRICT REFERRALS ({len(district_referrals)} TOTAL)")
        print("=" * 80)

        valid_escalated = 0
        bypassed_block = 0
        missing_history = 0

        valid_samples = []

        for r in district_referrals:
            history = sorted(r.transitions, key=lambda t: t.changed_at or t.id)
            if not history:
                missing_history += 1
                continue

            state_sequence = [t.to_state.value if hasattr(t.to_state, 'value') else str(t.to_state) for t in history]
            has_escalation = any(s in ["EMERGENCY_ESCALATED", "CONSULTED", "REFERRED_BACK", "FOLLOW_UP_DUE", "FOLLOW_UP_COMPLETED", "CLOSED"] for s in state_sequence)
            has_block_stage = any(s in ["SENT", "RECEIVED", "ACCEPTED", "APPOINTMENT_QUEUED"] for s in state_sequence)

            if has_block_stage and has_escalation:
                valid_escalated += 1
                if len(valid_samples) < 5:
                    valid_samples.append({
                        "referral_id": r.id,
                        "patient_id": r.patient_id,
                        "care_episode_id": r.care_episode_id,
                        "initial_dest": "MED-WB-FAC-000345 (Belur Block PHC)",
                        "transitions": " -> ".join(state_sequence),
                        "current_dest": f"{r.to_facility_id} ({fac_map.get(r.to_facility_id).name if fac_map.get(r.to_facility_id) else r.to_facility_id})",
                        "current_state": r.current_state.value
                    })
            elif not has_block_stage:
                bypassed_block += 1
            else:
                valid_escalated += 1

        print("\nCLASSIFICATION COUNTS:")
        print(f"1. Valid Block -> District Escalation History : {valid_escalated}")
        print(f"2. Bypassed Block Entirely                  : {bypassed_block}")
        print(f"3. Missing Transition History              : {missing_history}")

        print("\n5 REPRESENTATIVE VALID ESCALATED REFERRALS:")
        for s in valid_samples:
            print(f"Referral ID: {s['referral_id']}")
            print(f"  Patient ID    : {s['patient_id']}")
            print(f"  Care Episode  : {s['care_episode_id']}")
            print(f"  Initial Dest  : {s['initial_dest']}")
            print(f"  Transitions   : {s['transitions']}")
            print(f"  Current Dest  : {s['current_dest']}")
            print(f"  Current State : {s['current_state']}")
            print("-" * 60)

        # Audit fresh E2E referral e0c9f6e8-9f6a-4ef9-8bc5-06b94a49d20a
        res_e2e = await db.execute(
            select(Referral)
            .options(selectinload(Referral.transitions))
            .where(Referral.id == "e0c9f6e8-9f6a-4ef9-8bc5-06b94a49d20a")
        )
        e2e_ref = res_e2e.scalar_one_or_none()
        print("\nFRESH E2E REFERRAL VERIFICATION:")
        if e2e_ref:
            print(f"Referral ID: {e2e_ref.id}")
            print(f"  Patient ID       : {e2e_ref.patient_id}")
            print(f"  Care Episode ID  : {e2e_ref.care_episode_id}")
            print(f"  From Facility ID : {e2e_ref.from_facility_id}")
            print(f"  To Facility ID   : {e2e_ref.to_facility_id} ({fac_map.get(e2e_ref.to_facility_id).name if fac_map.get(e2e_ref.to_facility_id) else e2e_ref.to_facility_id})")
            print(f"  Current State    : {e2e_ref.current_state.value}")
            print(f"  Transitions      : {' -> '.join([t.to_state.value for t in e2e_ref.transitions])}")
        else:
            print("  Referral e0c9f6e8-9f6a-4ef9-8bc5-06b94a49d20a not found.")

if __name__ == "__main__":
    asyncio.run(main())
