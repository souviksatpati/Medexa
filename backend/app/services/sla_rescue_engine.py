from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.referral import Referral, TERMINAL_STATES
from app.models.continuity import ReferralRescueAction, RescueActionType, ReferralSla
from app.services.sla_engine import next_relevant_due_at, is_sla_breached

"""
Canonical context Section 8: "operational continuity intelligence, not
autonomous clinical diagnosis." A rescue action is a detected-and-logged
recommendation for a human to act on — it never changes a referral's
state, never contacts a patient, and never makes a clinical decision. It
only detects an SLA breach and writes an auditable record naming what
should happen next.

This module is deliberately conservative: it creates at most one
UNRESOLVED rescue action per referral at a time (checked before
inserting), so re-running the check repeatedly (e.g. on every dashboard
load) doesn't spam duplicate rescue actions for the same breach.
"""


async def check_and_trigger_rescue(db: AsyncSession, referral: Referral) -> ReferralRescueAction | None:
    if referral.current_state in TERMINAL_STATES:
        return None

    sla_result = await db.execute(select(ReferralSla).where(ReferralSla.referral_id == referral.id))
    sla = sla_result.scalar_one_or_none()
    if sla is None:
        return None

    due_at = next_relevant_due_at(referral.current_state, sla)
    now = datetime.now(timezone.utc)

    if not is_sla_breached(due_at, now):
        return None

    # Don't duplicate: check for an existing unresolved rescue action
    existing_result = await db.execute(
        select(ReferralRescueAction)
        .where(ReferralRescueAction.referral_id == referral.id)
        .where(ReferralRescueAction.resolved_at.is_(None))
    )
    if existing_result.scalar_one_or_none() is not None:
        return None

    action_type = _choose_action(referral)
    rescue = ReferralRescueAction(
        referral_id=referral.id,
        triggered_at=now,
        reason=f"SLA breached for state {referral.current_state.value}",
        action_taken=action_type,
    )
    db.add(rescue)
    await db.flush()
    return rescue


def _choose_action(referral: Referral) -> RescueActionType:
    """Simple, explainable rule — not a model. Escalate for referrals
    that have already breached once before (repeat offenders go
    straight to a supervisor); otherwise start with a worker notification."""
    if len(referral.rescue_actions) >= 1:
        return RescueActionType.ESCALATE_TO_SUPERVISOR
    return RescueActionType.NOTIFY_REFERRING_WORKER


async def resolve_rescue_actions_for_referral(db: AsyncSession, referral_id: str) -> None:
    """Called when a referral progresses past the state that triggered a
    rescue — marks any open rescue actions resolved, since the thing
    they were warning about no longer applies."""
    result = await db.execute(
        select(ReferralRescueAction)
        .where(ReferralRescueAction.referral_id == referral_id)
        .where(ReferralRescueAction.resolved_at.is_(None))
    )
    for action in result.scalars().all():
        action.resolved_at = datetime.now(timezone.utc)
