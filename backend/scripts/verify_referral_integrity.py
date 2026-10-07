import asyncio
import os
import sys

from sqlalchemy import select

sys.path.insert(0, os.path.abspath('backend'))

from app.core.database import AsyncSessionLocal
from app.models.referral import ReferralStateTransition
from app.services.referral_state_machine import validate_transition


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ReferralStateTransition).order_by(
                ReferralStateTransition.changed_at
            )
        )
        transitions = result.scalars().all()

        invalid = []

        for t in transitions:
            if t.from_state is None:
                continue

            try:
                validate_transition(t.from_state, t.to_state)
            except Exception as exc:
                invalid.append(
                    (
                        str(t.id),
                        str(t.referral_id),
                        t.from_state.value,
                        t.to_state.value,
                        str(exc),
                    )
                )

        print("=" * 70)
        print("PERSISTED REFERRAL STATE-MACHINE VALIDATION")
        print("=" * 70)
        print(f"Total transition rows : {len(transitions)}")
        print(f"Invalid transitions   : {len(invalid)}")

        if invalid:
            print()
            print("INVALID TRANSITIONS:")
            for item in invalid:
                print(
                    f"  ID={item[0]} "
                    f"REF={item[1]} "
                    f"{item[2]} -> {item[3]} "
                    f"| {item[4]}"
                )
            raise SystemExit(1)

        print()
        print("ALL PERSISTED TRANSITIONS ARE LEGAL.")


if __name__ == "__main__":
    asyncio.run(main())
