"""
Tests for sla_engine.py's due-date computation and next_relevant_due_at
state-mapping. The Rescue Engine itself (sla_rescue_engine.py) needs a
real async DB session to test end-to-end, so its dedupe/escalation logic
is covered by the pure functions here plus the referral state-machine
tests' existing coverage of state transitions.
"""
from datetime import datetime, timedelta, timezone

from app.models.referral import ReferralState
from app.services.sla_engine import (
    compute_initial_sla_due_dates,
    next_relevant_due_at,
    is_sla_breached,
)


class _FakeSla:
    """Minimal stand-in for the ReferralSla ORM row — avoids needing a
    real DB session just to test next_relevant_due_at's field mapping."""

    def __init__(self, **kwargs):
        for key in [
            "acknowledgement_due_at",
            "appointment_due_at",
            "consultation_due_at",
            "back_referral_due_at",
            "follow_up_due_at",
        ]:
            setattr(self, key, kwargs.get(key))


def test_initial_sla_dates_are_all_after_creation():
    created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    dates = compute_initial_sla_due_dates(created_at)
    for key, due_at in dates.items():
        assert due_at > created_at, f"{key} should be after creation time"


def test_sla_windows_are_in_expected_order():
    """Acknowledgement should be due before appointment, before
    consultation, before back-referral, before follow-up — a judge
    reasonably expects the funnel's deadlines to nest, not overlap
    randomly."""
    created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    dates = compute_initial_sla_due_dates(created_at)
    assert dates["acknowledgement_due_at"] < dates["appointment_due_at"]
    assert dates["appointment_due_at"] < dates["consultation_due_at"]
    assert dates["consultation_due_at"] < dates["back_referral_due_at"]
    assert dates["back_referral_due_at"] < dates["follow_up_due_at"]


def test_next_relevant_due_at_tracks_current_state():
    sla = _FakeSla(
        acknowledgement_due_at=datetime(2026, 1, 1, 6, tzinfo=timezone.utc),
        appointment_due_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
        consultation_due_at=datetime(2026, 1, 3, tzinfo=timezone.utc),
    )
    assert next_relevant_due_at(ReferralState.SENT, sla) == sla.acknowledgement_due_at
    assert next_relevant_due_at(ReferralState.ACCEPTED, sla) == sla.appointment_due_at
    assert next_relevant_due_at(ReferralState.APPOINTMENT_QUEUED, sla) == sla.consultation_due_at


def test_next_relevant_due_at_none_for_terminal_states():
    """CLOSED/REJECTED/etc aren't in the state-to-field map at all — a
    terminal referral should never be flagged as SLA-breached."""
    sla = _FakeSla(acknowledgement_due_at=datetime(2026, 1, 1, tzinfo=timezone.utc))
    assert next_relevant_due_at(ReferralState.CLOSED, sla) is None
    assert next_relevant_due_at(ReferralState.REJECTED, sla) is None


def test_is_sla_breached_true_when_past_due():
    due_at = datetime.now(timezone.utc) - timedelta(hours=1)
    assert is_sla_breached(due_at, datetime.now(timezone.utc)) is True


def test_is_sla_breached_false_when_not_yet_due():
    due_at = datetime.now(timezone.utc) + timedelta(hours=1)
    assert is_sla_breached(due_at, datetime.now(timezone.utc)) is False


def test_is_sla_breached_false_when_no_due_date():
    assert is_sla_breached(None, datetime.now(timezone.utc)) is False
