from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.observation import TriageAssessment
from app.schemas.triage import (
    TriageAssessmentCreate,
    TriageAssessmentOut,
    ClinicalRiskScoreRequest,
    ClinicalRiskScoreResponse,
)
from app.schemas.auth import TokenPayload
from app.services.clinical_risk_engine import compute_clinical_risk

router = APIRouter(prefix="/triage", tags=["triage"])


@router.post("", response_model=TriageAssessmentOut, status_code=201)
async def create_triage_assessment(
    payload: TriageAssessmentCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(TriageAssessment, payload.id)
    if existing is not None:
        return existing

    assessment = TriageAssessment(
        id=payload.id,
        care_episode_id=payload.care_episode_id,
        symptoms=payload.symptoms,
        vitals=payload.vitals.model_dump() if payload.vitals else None,
        clinical_risk_level=payload.clinical_risk_level,
        notes=payload.notes,
        performed_by=payload.performed_by,
        performed_at=payload.performed_at,
        sync_status="synced",
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment


@router.post("/score", response_model=ClinicalRiskScoreResponse)
async def score_clinical_risk(payload: ClinicalRiskScoreRequest):
    """
    Authoritative CLINICAL risk scoring. The frontend's offline copy
    (utils/clinicalRiskEngine.ts) computes the same result locally when
    disconnected; this endpoint is used when connectivity allows a
    server round-trip. For CONTINUITY risk (a separate concept), see
    POST /continuity/risk-score.
    """
    return compute_clinical_risk(payload)
