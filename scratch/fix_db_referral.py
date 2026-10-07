import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(text("UPDATE referrals SET to_facility_id = 'MED-WB-FAC-000345' WHERE patient_id = '4273e5b6-c615-4e3e-8b63-64979da1a11f' OR id LIKE 'e0c9f6e8%'"))
        await db.commit()
        print("Successfully updated referral to_facility_id to MED-WB-FAC-000345!")

if __name__ == "__main__":
    asyncio.run(main())
