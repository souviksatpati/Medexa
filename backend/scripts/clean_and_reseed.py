"""
Clean Reseed Script for Medexa.
Wipes transactional database tables safely and re-seeds fresh, coherent synthetic operational data
against existing West Bengal master reference tables.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from scripts.seed_operational_demo import seed

TRANSACTIONAL_TABLES = [
    "follow_up_tasks",
    "back_referrals",
    "referral_rescue_actions",
    "referral_slas",
    "referral_state_transitions",
    "referrals",
    "triage_assessments",
    "continuity_risk_scores",
    "care_episodes",
    "patients",
]

async def clean_transactional_data():
    print("=" * 70)
    print("CLEANING TRANSACTIONAL DATABASE TABLES...")
    print("=" * 70)
    async with AsyncSessionLocal() as db:
        for table in TRANSACTIONAL_TABLES:
            try:
                result = await db.execute(text(f"DELETE FROM {table}"))
                print(f"Cleared table '{table}': {result.rowcount} rows deleted.")
            except Exception as exc:
                print(f"Warning clearing table '{table}': {exc}")
        await db.commit()
        print("Transactional database tables cleaned successfully.\n")

async def main():
    await clean_transactional_data()
    print("=" * 70)
    print("RE-SEEDING FRESH OPERATIONAL SYNTHETIC DATASET...")
    print("=" * 70)
    await seed()

if __name__ == "__main__":
    asyncio.run(main())
