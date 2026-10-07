from datetime import datetime, timedelta

from app.core.config import settings
from app.models.referral import ReferralState

"""
Canonical context Section 12. SLA windows are business rules for this
demo/prototype, not clinical guidelines — say so plainly if asked. Each
due-at timestamp is computed once, at referral creation, relative to
created_at. A real production system might recompute windows dynamically
per facility/urgency; this is intentionally simple and explainable.
"""


def compute_initial_sla_due_dates(created_at: datetime) -> dict[str, datetime]:
    """Called once, when a referral is created. Returns the full set of
    due-at timestamps up front — a referral doesn't need to actually
    reach a stage for the SLA clock on that stage to be "next", since
    the tracker shows the *next* unmet deadline regardless of where in
    the lifecycle the referral currently sits."""
    return {
        "acknowledgement_due_at": created_at + timedelta(hours=settings.sla_acknowledgement_hours),
        "appointment_due_at": created_at + timedelta(hours=settings.sla_appointment_hours),
        "consultation_due_at": created_at + timedelta(hours=settings.sla_consultation_hours),
        "back_referral_due_at": created_at + timedelta(hours=settings.sla_back_referral_hours),
        "follow_up_due_at": created_at + timedelta(hours=settings.sla_follow_up_hours),
    }


def next_relevant_due_at(current_state: ReferralState, sla) -> datetime | None:
    """Given a referral's current state and its ReferralSla row, return
    the due-at timestamp that's actually relevant right now — e.g. once
    a referral is ACCEPTED, the acknowledgement deadline no longer
    matters; the appointment deadline does."""
    state_to_field = {
        ReferralState.DRAFT: "acknowledgement_due_at",
        ReferralState.SENT: "acknowledgement_due_at",
        ReferralState.RECEIVED: "acknowledgement_due_at",
        ReferralState.ACCEPTED: "appointment_due_at",
        ReferralState.APPOINTMENT_QUEUED: "consultation_due_at",
        ReferralState.CONSULTED: "back_referral_due_at",
        ReferralState.REFERRED_BACK: "follow_up_due_at",
        ReferralState.FOLLOW_UP_DUE: "follow_up_due_at",
    }
    field = state_to_field.get(current_state)
    if field is None or sla is None:
        return None
    return getattr(sla, field, None)


def is_sla_breached(due_at: datetime | None, now: datetime) -> bool:
    if due_at is None:
        return False
    return now > due_at
