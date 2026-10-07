import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.referral import Referral
from app.models.care_episode import CareEpisode
from app.models.observation import TriageAssessment
from app.models.patient import Patient

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Referral).where(Referral.id == '073d894e-5641-4f94-b80c-c21cdc2a0a2a'))
        ref = res.scalar_one_or_none()
        if not ref:
            res = await db.execute(select(Referral).order_by(Referral.created_at.desc()))
            ref = res.scalars().first()
            
        print("Referral ID:", ref.id if ref else "NONE")
        print("Referral patient_id:", ref.patient_id if ref else "NONE")
        print("Referral care_episode_id:", ref.care_episode_id if ref else "NONE")
        
        if ref:
            res_ep = await db.execute(select(CareEpisode).where(CareEpisode.id == ref.care_episode_id))
            episode = res_ep.scalar_one_or_none()
            print("Care Episode ID:", episode.id if episode else "NONE")
            print("Care Episode patient_id:", episode.patient_id if episode else "NONE")
            
            res_tr = await db.execute(select(TriageAssessment).where(TriageAssessment.care_episode_id == ref.care_episode_id))
            triage = res_tr.scalars().first()
            print("Triage ID:", triage.id if triage else "NONE")
            print("Triage care_episode_id:", triage.care_episode_id if triage else "NONE")
            
            res_pat = await db.execute(select(Patient).where(Patient.id == ref.patient_id))
            patient = res_pat.scalar_one_or_none()
            print("Patient ID:", patient.id if patient else "NONE")
            print("Patient Name:", patient.full_name if patient else "NONE")

            print("\n=== RELATIONSHIP VERIFICATION ===")
            print("triage.care_episode_id == episode.id:", triage.care_episode_id == episode.id if (triage and episode) else False)
            print("episode.patient_id == patient.id:", episode.patient_id == patient.id if (episode and patient) else False)
            print("referral.patient_id == patient.id:", ref.patient_id == patient.id if (ref and patient) else False)
            print("referral.care_episode_id == episode.id:", ref.care_episode_id == episode.id if (ref and episode) else False)

if __name__ == "__main__":
    asyncio.run(main())
