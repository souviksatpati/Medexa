import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.referral import Referral
from app.models.facility import Facility

# Facility lookup map from DB
BLOCK_FACILITY_IDS = {"MED-WB-FAC-000345", "MED-WB-FAC-000002", "FAC-WB-PHC-01", "FAC-WB-CHC-02"}
DISTRICT_FACILITY_IDS = {"MED-WB-FAC-000349", "FAC-WB-DH-04"}

async def main():
    async with AsyncSessionLocal() as db:
        res_facs = await db.execute(select(Facility))
        fac_map = {f.id: f for f in res_facs.scalars().all()}
        
        res = await db.execute(select(Referral))
        referrals = res.scalars().all()
        
        print("=" * 80)
        print("READ-ONLY AUDIT OF ASHA-ORIGIN REFERRALS")
        print("=" * 80)
        
        total_asha_block = 0
        correct_block = 0
        incorrect_district = 0
        other_dest = 0
        
        for r in referrals:
            # Check if originating from ASHA (from_facility_id = MED-WB-FAC-000372 or created_by ASHA)
            if r.from_facility_id == "MED-WB-FAC-000372" or r.created_by.startswith("ASHA") or r.created_by == "demo-asha-001":
                total_asha_block += 1
                to_fac = fac_map.get(r.to_facility_id)
                fac_name = to_fac.name if to_fac else r.to_facility_id
                fac_type = to_fac.facility_type.value if (to_fac and to_fac.facility_type) else "UNKNOWN"
                
                is_correct_block = (r.to_facility_id in BLOCK_FACILITY_IDS) or ("phc" in fac_name.lower() or "chc" in fac_name.lower() or "bphc" in fac_name.lower() or "rural hospital" in fac_name.lower())
                is_incorrect_district = r.to_facility_id in DISTRICT_FACILITY_IDS or ("district hospital" in fac_name.lower() and r.current_state.value in ["SENT", "RECEIVED", "ACCEPTED"])
                
                if is_correct_block and not is_incorrect_district:
                    correct_block += 1
                    status_flag = "OK (Block PHC/CHC)"
                elif is_incorrect_district:
                    incorrect_district += 1
                    status_flag = "FAIL (Direct to District)"
                else:
                    other_dest += 1
                    status_flag = "OTHER"
                
                print(f"Referral ID: {r.id}")
                print(f"  Patient ID: {r.patient_id}")
                print(f"  Care Episode ID: {r.care_episode_id}")
                print(f"  From Facility: {r.from_facility_id}")
                print(f"  To Facility: {r.to_facility_id} ({fac_name} [{fac_type}])")
                print(f"  State: {r.current_state.value}")
                print(f"  Created By: {r.created_by}")
                print(f"  Classification: {status_flag}")
                print("-" * 80)
                
        print("\nSUMMARY COUNTS:")
        print(f"Total ASHA-origin referrals      : {total_asha_block}")
        print(f"Correct Block destinations       : {correct_block}")
        print(f"Incorrect District destinations  : {incorrect_district}")
        print(f"Other/missing destinations       : {other_dest}")

if __name__ == "__main__":
    asyncio.run(main())
