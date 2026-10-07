import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.observation import TriageAssessment

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(TriageAssessment).order_by(TriageAssessment.created_at.desc()))
        triages = res.scalars().all()
        print(f"Total Triage Assessments in DB: {len(triages)}")
        for t in triages[:5]:
            print(f"ID: {t.id}, Episode ID: {t.care_episode_id}, Created: {t.created_at}")

if __name__ == "__main__":
    asyncio.run(main())
