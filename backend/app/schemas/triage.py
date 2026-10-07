from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.observation import ClinicalRiskLevel, SyncStatus


class VitalsSchema(BaseModel):
    systolic_bp: float | None = None
    diastolic_bp: float | None = None
    pulse: float | None = None
    temp_c: float | None = None
    spo2: float | None = Field(default=None, ge=0, le=100)


class TriageAssessmentCreate(BaseModel):
    id: str
    care_episode_id: str
    symptoms: list[str] = Field(min_length=1)
    vitals: VitalsSchema | None = None
    clinical_risk_level: ClinicalRiskLevel
    notes: str | None = None
    performed_by: str
    performed_at: datetime
    sync_status: SyncStatus = SyncStatus.PENDING


class TriageAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    care_episode_id: str
    symptoms: list[str]
    vitals: dict | None
    clinical_risk_level: ClinicalRiskLevel
    notes: str | None
    performed_by: str
    performed_at: datetime
    sync_status: SyncStatus


class ClinicalRiskScoreRequest(BaseModel):
    """
    CLINICAL risk scoring only — "how urgent is this patient's condition
    right now?" Deliberately has no knowledge of referrals, SLAs, or
    facility load (see app/services/clinical_risk_engine.py). For
    continuity risk (a structurally separate concept per canonical
    context Section 16), see ContinuityRiskScoreRequest in
    schemas/continuity.py.
    """

    symptoms: list[str]
    vitals: VitalsSchema | None = None


class ClinicalRiskScoreResponse(BaseModel):
    clinical_risk_level: ClinicalRiskLevel
    score: int
    contributing_factors: list[str]
