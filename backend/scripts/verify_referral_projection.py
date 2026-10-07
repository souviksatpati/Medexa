import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.referral import Referral, ReferralStateTransition


async def main():
    async with AsyncSessionLocal() as db:
        referrals = (
            await db.execute(
                select(Referral).order_by(Referral.id)
            )
        ).scalars().all()

        mismatches = []
        no_history = []

        for referral in referrals:
            transitions = (
                await db.execute(
                    select(ReferralStateTransition)
                    .where(
                        ReferralStateTransition.referral_id == referral.id
                    )
                    .order_by(
                        ReferralStateTransition.changed_at.desc()
                    )
                    .limit(1)
                )
            ).scalars().first()

            if transitions is None:
                no_history.append(referral.id)
                continue

            if referral.current_state != transitions.to_state:
                mismatches.append(
                    (
                        referral.id,
                        referral.current_state.value,
                        transitions.to_state.value,
                    )
                )

        print("=" * 70)
        print("REFERRAL CURRENT-STATE / HISTORY CONSISTENCY")
        print("=" * 70)
        print(f"Total referrals       : {len(referrals)}")
        print(f"Missing history       : {len(no_history)}")
        print(f"State mismatches      : {len(mismatches)}")

        if no_history:
            print()
            print("REFERRALS WITHOUT TRANSITION HISTORY:")
            for referral_id in no_history:
                print(f"  - {referral_id}")

        if mismatches:
            print()
            print("STATE MISMATCHES:")
            for referral_id, current, latest in mismatches:
                print(
                    f"  {referral_id}: "
                    f"current_state={current}, "
                    f"latest_transition={latest}"
                )

        if no_history or mismatches:
            raise SystemExit(1)

        print()
        print("ALL REFERRAL STATE PROJECTIONS ARE CONSISTENT.")


if __name__ == "__main__":
    asyncio.run(main())
