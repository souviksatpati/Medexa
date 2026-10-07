from __future__ import annotations

import asyncio

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


TARGET_PATIENTS = [f"P{i:03d}" for i in range(1, 51)]
TARGET_EPISODES = [f"EP{i:03d}" for i in range(1, 51)]
TARGET_REFERRALS = [f"REF{i:03d}" for i in range(1, 51)]


async def delete_by_ids(conn, table: str, column: str, ids: list[str]) -> int:
    if not ids:
        return 0

    stmt = text(
        f"DELETE FROM {table} "
        f"WHERE {column} IN :ids"
    ).bindparams(bindparam("ids", expanding=True))

    result = await conn.execute(stmt, {"ids": ids})
    return result.rowcount


async def main() -> None:
    engine = create_async_engine(settings.database_url)

    try:
        async with engine.begin() as conn:
            print("=" * 60)
            print("MEDEXA OPERATIONAL DEMO CLEANUP")
            print("=" * 60)

            # --------------------------------------------------------
            # PREFLIGHT
            # --------------------------------------------------------

            result = await conn.execute(
                text("SELECT COUNT(*) FROM patients WHERE id LIKE 'P%'")
            )
            patient_count = result.scalar_one()

            result = await conn.execute(
                text("SELECT COUNT(*) FROM care_episodes WHERE id LIKE 'EP%'")
            )
            episode_count = result.scalar_one()

            result = await conn.execute(
                text("SELECT COUNT(*) FROM referrals WHERE id LIKE 'REF%'")
            )
            referral_count = result.scalar_one()

            result = await conn.execute(
                text("SELECT COUNT(*) FROM facilities")
            )
            facility_count = result.scalar_one()

            result = await conn.execute(
                text("SELECT COUNT(*) FROM locations")
            )
            location_count = result.scalar_one()

            print(f"Patients matching P%       : {patient_count}")
            print(f"Episodes matching EP%      : {episode_count}")
            print(f"Referrals matching REF%    : {referral_count}")
            print(f"Facilities                 : {facility_count}")
            print(f"Locations                  : {location_count}")
            print()

            # We expect the database we audited:
            # 50 synthetic patients + 50 synthetic episodes +
            # 52 referrals (50 seeded + 2 live-test referrals).
            #
            # Refuse to run if the core expected records aren't present.
            if patient_count < 50:
                raise RuntimeError(
                    f"Preflight failed: expected at least 50 P% patients, "
                    f"found {patient_count}."
                )

            if episode_count < 50:
                raise RuntimeError(
                    f"Preflight failed: expected at least 50 EP% episodes, "
                    f"found {episode_count}."
                )

            if referral_count < 50:
                raise RuntimeError(
                    f"Preflight failed: expected at least 50 REF% referrals, "
                    f"found {referral_count}."
                )

            # --------------------------------------------------------
            # Discover temporary live-test referrals.
            # --------------------------------------------------------

            result = await conn.execute(
                text(
                    """
                    SELECT id
                    FROM referrals
                    WHERE id LIKE 'REF-TEST-%'
                    ORDER BY id
                    """
                )
            )

            test_referral_ids = [row[0] for row in result.fetchall()]
            all_referral_ids = TARGET_REFERRALS + test_referral_ids

            print(f"Seed referrals targeted     : {len(TARGET_REFERRALS)}")
            print(f"Test referrals discovered   : {len(test_referral_ids)}")

            if test_referral_ids:
                print("Test referrals:")
                for referral_id in test_referral_ids:
                    print(f"  - {referral_id}")

            print()

            # --------------------------------------------------------
            # 1. REFERRAL CHILDREN
            # --------------------------------------------------------

            deleted_transitions = await delete_by_ids(
                conn,
                "referral_state_transitions",
                "referral_id",
                all_referral_ids,
            )

            deleted_slas = await delete_by_ids(
                conn,
                "referral_slas",
                "referral_id",
                all_referral_ids,
            )

            deleted_rescue = await delete_by_ids(
                conn,
                "referral_rescue_actions",
                "referral_id",
                all_referral_ids,
            )

            deleted_back = await delete_by_ids(
                conn,
                "back_referrals",
                "referral_id",
                all_referral_ids,
            )

            deleted_referral_followups = await delete_by_ids(
                conn,
                "follow_up_tasks",
                "referral_id",
                all_referral_ids,
            )

            # --------------------------------------------------------
            # 2. REFERRALS
            # --------------------------------------------------------

            deleted_referrals = await delete_by_ids(
                conn,
                "referrals",
                "id",
                all_referral_ids,
            )

            # --------------------------------------------------------
            # 3. CARE-EPISODE CHILDREN
            # --------------------------------------------------------

            deleted_followups = await delete_by_ids(
                conn,
                "follow_up_tasks",
                "care_episode_id",
                TARGET_EPISODES,
            )

            deleted_risk = await delete_by_ids(
                conn,
                "continuity_risk_scores",
                "care_episode_id",
                TARGET_EPISODES,
            )

            deleted_triage = await delete_by_ids(
                conn,
                "triage_assessments",
                "care_episode_id",
                TARGET_EPISODES,
            )

            deleted_encounters = await delete_by_ids(
                conn,
                "encounters",
                "care_episode_id",
                TARGET_EPISODES,
            )

            deleted_observations = await delete_by_ids(
                conn,
                "observations",
                "care_episode_id",
                TARGET_EPISODES,
            )

            # --------------------------------------------------------
            # 4. CARE EPISODES
            # --------------------------------------------------------

            deleted_episodes = await delete_by_ids(
                conn,
                "care_episodes",
                "id",
                TARGET_EPISODES,
            )

            # --------------------------------------------------------
            # 5. PATIENTS
            # --------------------------------------------------------

            deleted_patients = await delete_by_ids(
                conn,
                "patients",
                "id",
                TARGET_PATIENTS,
            )

            # --------------------------------------------------------
            # SUMMARY
            # --------------------------------------------------------

            print("=" * 60)
            print("CLEANUP DELETION SUMMARY")
            print("=" * 60)

            print(f"Referral transitions deleted : {deleted_transitions}")
            print(f"Referral SLAs deleted        : {deleted_slas}")
            print(f"Rescue actions deleted       : {deleted_rescue}")
            print(f"Back referrals deleted       : {deleted_back}")
            print(f"Referral follow-ups deleted  : {deleted_referral_followups}")
            print(f"Referrals deleted            : {deleted_referrals}")
            print(f"Episode follow-ups deleted   : {deleted_followups}")
            print(f"Risk scores deleted          : {deleted_risk}")
            print(f"Triage assessments deleted   : {deleted_triage}")
            print(f"Encounters deleted           : {deleted_encounters}")
            print(f"Observations deleted         : {deleted_observations}")
            print(f"Care episodes deleted        : {deleted_episodes}")
            print(f"Patients deleted             : {deleted_patients}")

            print()
            print("Transaction completed successfully.")
            print("SQLAlchemy will COMMIT this transaction.")

    except Exception:
        print()
        print("=" * 60)
        print("CLEANUP FAILED")
        print("=" * 60)
        print("Transaction will be ROLLED BACK.")
        raise

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
