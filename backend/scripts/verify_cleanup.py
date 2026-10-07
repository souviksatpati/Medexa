import asyncio

from sqlalchemy import text
from app.core.database import engine


TABLES = [
    "patients",
    "care_episodes",
    "triage_assessments",
    "referrals",
    "referral_state_transitions",
    "referral_slas",
    "referral_rescue_actions",
    "back_referrals",
    "follow_up_tasks",
    "continuity_risk_scores",
    "facilities",
    "locations",
]


async def main():
    async with engine.connect() as conn:
        print("=" * 50)
        print("POST-CLEANUP DATABASE VERIFICATION")
        print("=" * 50)

        for table in TABLES:
            result = await conn.execute(
                text(f"SELECT COUNT(*) FROM {table}")
            )
            print(f"{table:30} {result.scalar_one():>8}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
