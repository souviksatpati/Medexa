from datetime import datetime, timezone, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserRole
from app.models.referral import Referral, ReferralStateTransition
from app.models.continuity import ReferralSla, BackReferral, FollowUpTask, FollowUpStatus
from app.schemas.referral import ReferralCreate, ReferralOut, ReferralTransitionRequest
from app.schemas.continuity import (
    BackReferralCreate,
    BackReferralOut,
    ReferralFailureReasonRequest,
)
from app.schemas.auth import TokenPayload
from app.services.referral_state_machine import validate_transition, IllegalTransitionError
from app.services.sla_engine import compute_initial_sla_due_dates
from app.services.sla_rescue_engine import check_and_trigger_rescue, resolve_rescue_actions_for_referral

router = APIRouter(prefix="/referrals", tags=["referrals"])


async def _get_referral_with_history(db: AsyncSession, referral_id: str) -> Referral | None:
    result = await db.execute(
        select(Referral)
        .where(Referral.id == referral_id)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
        )
        # populate_existing is required here, not optional: without it,
        # SQLAlchemy's identity map returns the SAME Python object on a
        # repeat query within one session, and an already-loaded
        # relationship collection (e.g. rescue_actions, loaded empty on
        # the first call in _get_and_check_rescue below) is NOT
        # overwritten by a later selectinload â€” even after a fresh
        # commit. Confirmed by direct reproduction: two identical
        # queries in the same session, with a row inserted and
        # committed between them, returned the same stale empty
        # collection both times without this option. This silently
        # broke the Rescue Engine's core promise (a freshly-triggered
        # rescue action would never appear in the very API response
        # meant to report it) until caught by testing against real,
        # already-overdue seeded referrals.
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def _get_and_check_rescue(db: AsyncSession, referral_id: str) -> Referral | None:
    referral = await _get_referral_with_history(db, referral_id)
    if referral is None:
        return None
    rescue = await check_and_trigger_rescue(db, referral)
    if rescue is not None:
        await db.commit()
        referral = await _get_referral_with_history(db, referral_id)
    return referral


@router.get("", response_model=list[ReferralOut])
async def list_referrals(
    current_state: str | None = None,
    to_facility_id: str | None = None,
    from_facility_id: str | None = None,
    created_by: str | None = None,
    patient_id: str | None = None,
    limit: int = 200,
    offset: int = 0,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Referral)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
        )
        .order_by(Referral.created_at.desc())
    )

    if current_user.role == UserRole.ASHA_WORKER:
        if created_by:
            query = query.where(Referral.created_by == created_by)
        elif from_facility_id:
            query = query.where(Referral.from_facility_id == from_facility_id)
        elif current_user.facility_id:
            query = query.where(
                (Referral.created_by == current_user.sub) | (Referral.from_facility_id == current_user.facility_id)
            )
        else:
            query = query.where(Referral.created_by == current_user.sub)
    else:
        if created_by:
            query = query.where(Referral.created_by == created_by)
        if to_facility_id:
            query = query.where(Referral.to_facility_id == to_facility_id)
        if from_facility_id:
            query = query.where(Referral.from_facility_id == from_facility_id)

    if current_state:
        query = query.where(Referral.current_state == current_state)
    if patient_id:
        query = query.where(Referral.patient_id == patient_id)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=ReferralOut, status_code=201)
async def create_referral(
    payload: ReferralCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await _get_referral_with_history(db, payload.id)
    if existing is not None:
        return existing

    referral = Referral(
        id=payload.id,
        care_episode_id=payload.care_episode_id,
        patient_id=payload.patient_id,
        from_facility_id=payload.from_facility_id,
        to_facility_id=payload.to_facility_id,
        current_state=payload.current_state,
        reason=payload.reason,
        priority=payload.priority,
        created_by=payload.created_by,
        sync_status="synced",
    )
    db.add(referral)

    db.add(
        ReferralStateTransition(
            referral_id=referral.id,
            from_state=None,
            to_state=referral.current_state,
            changed_by=current_user.sub,
            changed_at=datetime.now(timezone.utc),
            device_local_timestamp=payload.created_at,
        )
    )

    sla_dates = compute_initial_sla_due_dates(payload.created_at)
    db.add(ReferralSla(referral_id=referral.id, **sla_dates))

    await db.commit()
    return await _get_referral_with_history(db, referral.id)


@router.get("/{referral_id}", response_model=ReferralOut)
async def get_referral(
    referral_id: str,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    referral = await _get_and_check_rescue(db, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


async def _apply_referral_transition(
    db: AsyncSession,
    referral_id: str,
    payload: ReferralTransitionRequest,
    current_user: TokenPayload,
) -> Referral:
    """Apply a referral transition while holding a row lock.

    The lock serializes concurrent transitions for the same referral.
    This prevents two workers from both validating the same old state and
    then writing incompatible next states.
    """
    result = await db.execute(
        select(Referral)
        .where(Referral.id == referral_id)
        .with_for_update()
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
        )
    )
    referral = result.scalar_one_or_none()
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    already_applied = await db.get(ReferralStateTransition, payload.id)
    if already_applied is not None:
        return referral

    try:
        validate_transition(referral.current_state, payload.to_state)
    except IllegalTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    transition = ReferralStateTransition(
        id=payload.id,
        referral_id=referral.id,
        from_state=referral.current_state,
        to_state=payload.to_state,
        changed_by=current_user.sub,
        changed_at=datetime.now(timezone.utc),
        device_local_timestamp=payload.device_local_timestamp,
        note=payload.note,
    )
    db.add(transition)
    referral.current_state = payload.to_state
    referral.sync_status = "synced"

    await resolve_rescue_actions_for_referral(db, referral.id)
    await db.commit()
    return await _get_referral_with_history(db, referral_id)


@router.patch("/{referral_id}/transition", response_model=ReferralOut)
async def transition_referral(
    referral_id: str,
    payload: ReferralTransitionRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Authoritative transition endpoint with transaction-level locking."""
    return await _apply_referral_transition(db, referral_id, payload, current_user)


@router.get("/episode/{care_episode_id}", response_model=list[ReferralOut])
async def list_episode_referrals(
    care_episode_id: str,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Referral)
        .where(Referral.care_episode_id == care_episode_id)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
        )
    )
    return list(result.scalars().all())


@router.patch("/{referral_id}/failure-reason", response_model=ReferralOut)
async def set_failure_reason(
    referral_id: str,
    payload: ReferralFailureReasonRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    referral = await db.get(Referral, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    referral.failure_reason = payload.failure_reason
    await db.commit()
    return await _get_referral_with_history(db, referral_id)


@router.post("/back-referral", response_model=BackReferralOut, status_code=201)
async def create_back_referral(
    payload: BackReferralCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(BackReferral, payload.id)
    if existing is not None:
        return existing

    referral = await db.get(Referral, payload.referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    back_referral = BackReferral(
        id=payload.id,
        referral_id=payload.referral_id,
        outcome=payload.outcome,
        treatment=payload.treatment,
        medication=payload.medication,
        follow_up_date=payload.follow_up_date,
        warning_signs=payload.warning_signs,
        instructions=payload.instructions,
        recorded_by=payload.recorded_by,
        recorded_at=payload.recorded_at,
    )
    db.add(back_referral)

    follow_up_due = payload.follow_up_date or (datetime.now(timezone.utc) + timedelta(days=3))
    follow_up = FollowUpTask(
        id=str(uuid.uuid4()),
        care_episode_id=referral.care_episode_id,
        referral_id=referral.id,
        due_at=follow_up_due,
        reason=payload.instructions or "Post-discharge home monitoring and vitals check",
        assigned_to=referral.created_by,
        status=FollowUpStatus.PENDING,
    )
    db.add(follow_up)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A back-referral already exists for this referral.",
        )

    await db.refresh(back_referral)
    return back_referral


class SyncTransitionPayload(ReferralTransitionRequest):
    referral_id: str
    from_state: str | None = None


@router.post("/transition", response_model=ReferralOut)
async def sync_referral_transition(
    payload: SyncTransitionPayload,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Offline sync entry point; uses the same locked transition path."""
    return await _apply_referral_transition(db, payload.referral_id, payload, current_user)


