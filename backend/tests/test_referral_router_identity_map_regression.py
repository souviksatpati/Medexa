import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.models.patient import Patient, Sex
from app.models.care_episode import CareEpisode, CareEpisodeStatus
from app.models.facility import Facility, FacilityType, CoordinateStatus, AvailabilityLevel
from app.models.referral import Referral, ReferralState
from app.models.continuity import ReferralSla, ReferralRescueAction, RescueActionType
from app.routers.referrals import _get_referral_with_history

pytestmark = pytest.mark.asyncio


async def _make_referral_fixture(db):
    """Minimal real rows — a patient, episode, two facilities, and a
    referral whose acknowledgement SLA is already in the past — so
    is_sla_breached is trivially true without depending on wall-clock
    timing tricks."""
    suffix = uuid.uuid4().hex[:8]
    patient = Patient(
        id=f"test-patient-{suffix}", full_name="Test Patient", age=30,
        sex=Sex.FEMALE, village_or_ward="Test Village",
    )
    from_facility = Facility(
        id=f"test-fac-from-{suffix}", name="Test Sub-Centre",
        facility_type=FacilityType.SUB_CENTRE,
        coordinate_status=CoordinateStatus.PRESENT,
        service_availability=AvailabilityLevel.AVAILABLE,
        diagnostic_availability=AvailabilityLevel.AVAILABLE,
        medicine_availability=AvailabilityLevel.AVAILABLE,
    )
    to_facility = Facility(
        id=f"test-fac-to-{suffix}", name="Test PHC",
        facility_type=FacilityType.PHC,
        coordinate_status=CoordinateStatus.PRESENT,
        service_availability=AvailabilityLevel.AVAILABLE,
        diagnostic_availability=AvailabilityLevel.AVAILABLE,
        medicine_availability=AvailabilityLevel.AVAILABLE,
    )
    db.add_all([patient, from_facility, to_facility])
    await db.flush()

    episode = CareEpisode(
        id=f"test-episode-{suffix}", patient_id=patient.id,
        status=CareEpisodeStatus.OPEN, opened_at=datetime.now(timezone.utc),
    )
    db.add(episode)
    await db.flush()

    referral = Referral(
        id=f"test-referral-{suffix}", care_episode_id=episode.id, patient_id=patient.id,
        from_facility_id=from_facility.id, to_facility_id=to_facility.id,
        current_state=ReferralState.SENT, reason="test", created_by="test-worker",
        sync_status="synced",
    )
    db.add(referral)
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    db.add(ReferralSla(referral_id=referral.id, acknowledgement_due_at=past))
    await db.flush()

    return referral


async def test_rescue_action_visible_immediately_after_commit_same_session(db_session):
    """
    Regression test for the exact bug found in this session: a rescue
    action correctly written and committed must be visible on a
    same-session re-query using the identical selectinload pattern the
    referrals router uses. Before the fix (adding
    execution_options(populate_existing=True) to
    _get_referral_with_history), this assertion failed — the re-query
    returned the same Python object from SQLAlchemy's identity map with
    its rescue_actions collection stuck at the stale, empty value
    loaded on the FIRST query, even though the row existed in the
    database and a fresh session would see it correctly.
    """
    referral = await _make_referral_fixture(db_session)

    # First load — mirrors _get_and_check_rescue's first fetch
    loaded_before = await _get_referral_with_history(db_session, referral.id)
    assert loaded_before.rescue_actions == []

    # Simulate what check_and_trigger_rescue does: insert + commit
    rescue = ReferralRescueAction(
        referral_id=referral.id, triggered_at=datetime.now(timezone.utc),
        reason="SLA breached for state SENT",
        action_taken=RescueActionType.NOTIFY_REFERRING_WORKER,
    )
    db_session.add(rescue)
    await db_session.commit()

    # Second load — same session, same query shape as the router's
    # post-commit re-fetch. This is the exact case that was broken.
    loaded_after = await _get_referral_with_history(db_session, referral.id)
    assert len(loaded_after.rescue_actions) == 1
    assert loaded_after.rescue_actions[0].reason == "SLA breached for state SENT"
