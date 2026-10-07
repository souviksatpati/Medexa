import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.referral import Referral
from app.models.patient import Patient
from app.models.care_episode import CareEpisode
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Referral).where(Referral.patient_id == '4273e5b6-c615-4e3e-8b63-64979da1a11f'))
        referrals = res.scalars().all()
        if not referrals:
            res = await db.execute(select(Referral).order_by(Referral.created_at.desc()))
            referrals = res.scalars().all()[:5]
            
        print("FOUND REFERRALS:")
        for r in referrals:
            print(f"ID: {r.id}")
            print(f"  patient_id: {r.patient_id}")
            print(f"  care_episode_id: {r.care_episode_id}")
            print(f"  from_facility_id: {r.from_facility_id}")
            print(f"  to_facility_id: {r.to_facility_id}")
            print(f"  current_state: {r.current_state}")
            print(f"  created_by: {r.created_by}")
            print(f"  reason: {r.reason}")
            print(f"  priority: {r.priority}")

        print("\nALL USERS IN DB:")
        users_res = await db.execute(select(User))
        for u in users_res.scalars().all():
            print(f"User ID: {u.id}, Username: {u.username}, Role: {u.role}, Facility ID: {u.facility_id}")

if __name__ == "__main__":
    asyncio.run(main())
