from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.care_episode import CareEpisode
from app.models.audit_log import AuditLog
from app.schemas.patient import CareEpisodeCreate, CareEpisodeOut
from app.schemas.auth import TokenPayload

router = APIRouter(prefix="/care-episodes", tags=["care-episodes"])


@router.post("", response_model=CareEpisodeOut, status_code=201)
async def create_care_episode(
    payload: CareEpisodeCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(CareEpisode, payload.id)
    if existing is not None:
        return existing

    episode = CareEpisode(
        id=payload.id,
        patient_id=payload.patient_id,
        status=payload.status,
        opened_at=payload.opened_at,
    )
    db.add(episode)
    db.add(
        AuditLog(
            entity_type="care_episode",
            entity_id=episode.id,
            action="create",
            changed_by=current_user.sub,
            changed_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()
    await db.refresh(episode)
    return episode


@router.get("/{episode_id}", response_model=CareEpisodeOut)
async def get_care_episode(episode_id: str, db: AsyncSession = Depends(get_db)):
    """
    This single endpoint IS the "longitudinal record" claim made real —
    everything hanging off care_episode_id (triage, referral, history)
    is reachable from here in one query, which is the entire point of
    Care Episode being the root entity (Build Guide Section 2).
    """
    result = await db.execute(
        select(CareEpisode)
        .where(CareEpisode.id == episode_id)
        .options(
            selectinload(CareEpisode.triage_assessments),
            selectinload(CareEpisode.referrals),
            selectinload(CareEpisode.observations),
            selectinload(CareEpisode.encounters),
        )
    )
    episode = result.scalar_one_or_none()
    if episode is None:
        raise HTTPException(status_code=404, detail="Care episode not found")
    return episode


@router.get("/patient/{patient_id}", response_model=list[CareEpisodeOut])
async def list_patient_episodes(patient_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CareEpisode)
        .where(CareEpisode.patient_id == patient_id)
        .order_by(CareEpisode.opened_at.desc())
    )
    return list(result.scalars().all())
