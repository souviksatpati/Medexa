from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.continuity import ContinuityRiskScore as ContinuityRiskScoreModel, FollowUpTask, FollowUpStatus
from app.schemas.continuity import (
    ContinuityRiskScoreRequest,
    ContinuityRiskScoreOut,
    FollowUpTaskOut,
    FollowUpTaskCreate,
)
from app.schemas.auth import TokenPayload
from app.services.continuity_risk_engine import compute_continuity_risk

router = APIRouter(prefix="/continuity", tags=["continuity"])


@router.post("/risk-score/{care_episode_id}", response_model=ContinuityRiskScoreOut)
async def score_and_record_continuity_risk(
    care_episode_id: str,
    payload: ContinuityRiskScoreRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Authoritative CONTINUITY risk scoring — a structurally separate
    concept from clinical risk (POST /triage/score). Each call persists
    a new ContinuityRiskScore row rather than overwriting a single
    field, so risk trend over time and "why was this patient flagged"
    stay auditable even after the underlying factors change.
    """
    score, level, reasons, recommended_action = compute_continuity_risk(payload)

    record = ContinuityRiskScoreModel(
        care_episode_id=care_episode_id,
        score=score,
        level=level,
        reasons=reasons,
        recommended_action=recommended_action,
        computed_at=datetime.now(timezone.utc),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/risk-score/{care_episode_id}/history", response_model=list[ContinuityRiskScoreOut])
async def get_continuity_risk_history(care_episode_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ContinuityRiskScoreModel)
        .where(ContinuityRiskScoreModel.care_episode_id == care_episode_id)
        .order_by(ContinuityRiskScoreModel.computed_at.desc())
    )
    return list(result.scalars().all())


@router.post("/follow-ups", response_model=FollowUpTaskOut, status_code=201)
async def create_follow_up(
    payload: FollowUpTaskCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Idempotent follow-up creation used by offline sync."""
    if current_user.role.value == "asha_worker" and payload.assigned_to != current_user.sub:
        raise HTTPException(status_code=403, detail="Follow-up assignment is outside your scope")
    existing = await db.get(FollowUpTask, payload.id)
    if existing is not None:
        return existing
    task = FollowUpTask(**payload.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/follow-ups", response_model=list[FollowUpTaskOut])
async def list_follow_ups(
    assigned_to: str | None = None,
    status_filter: str | None = None,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Backs the frontline worker dashboard's "who needs attention now?"
    view (canonical context Section 27) — filterable by worker and
    status so a worker's home screen only shows their own overdue/
    pending follow-ups, not the whole district's.
    """
    stmt = select(FollowUpTask)
    # ASHA workers may only read their own assigned tasks. District officers
    # can see the district queue; the demo doctor is allowed to inspect the
    # queue as an operational supervisor.
    if current_user.role.value == "asha_worker":
        assigned_to = current_user.sub
    if assigned_to:
        stmt = stmt.where(FollowUpTask.assigned_to == assigned_to)
    if status_filter:
        stmt = stmt.where(FollowUpTask.status == status_filter)
    stmt = stmt.order_by(FollowUpTask.due_at.asc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/follow-ups/{task_id}", response_model=FollowUpTaskOut)
async def update_follow_up(
    task_id: str,
    status: FollowUpStatus,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a follow-up task completed/overdue without inventing a local-only state."""
    task = await db.get(FollowUpTask, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Follow-up task not found")
    if current_user.role.value == "asha_worker" and task.assigned_to != current_user.sub:
        raise HTTPException(status_code=403, detail="Follow-up task is outside your assignment")
    task.status = status
    task.completed_at = datetime.now(timezone.utc) if status == FollowUpStatus.COMPLETED else None
    await db.commit()
    await db.refresh(task)
    return task
