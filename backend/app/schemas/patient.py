from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.patient import Sex
from app.models.care_episode import CareEpisodeStatus


class PatientCreate(BaseModel):
    """
    Field names and types here must match src/models/careEpisode.ts's
    PatientSchema exactly. That correspondence — not documentation — is
    what keeps the frontend and backend from silently drifting apart
    (Build Guide Section 7).
    """

    id: str
    full_name: str = Field(min_length=1)
    age: int = Field(ge=0, le=120)
    sex: Sex
    village_or_ward: str = Field(min_length=1)
    phone: str | None = None
    chronic_conditions: list[str] = Field(default_factory=list)
    created_at: datetime


class PatientOut(PatientCreate):
    model_config = ConfigDict(from_attributes=True)


class CareEpisodeCreate(BaseModel):
    id: str
    patient_id: str
    status: CareEpisodeStatus = CareEpisodeStatus.OPEN
    opened_at: datetime


class CareEpisodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    status: CareEpisodeStatus
    opened_at: datetime
    closed_at: datetime | None = None
