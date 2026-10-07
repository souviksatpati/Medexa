from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class ClinicalRiskLevel(str, enum.Enum):
    """CLINICAL risk only — "how urgent is this patient's condition right
    now?" Never merge with ContinuityRiskLevel (see models/continuity.py).
    MEDEXA_CANONICAL_PROJECT_CONTEXT.md Section 16 is a hard rule on this
    separation."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EMERGENCY = "emergency"


class SyncStatus(str, enum.Enum):
    SYNCED = "synced"
    PENDING = "pending"
    CONFLICT = "conflict"


class TriageAssessment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Mirrors the frontend's TriageAssessment Zod schema field-for-field
    (src/models/careEpisode.ts) — including the clinicalRiskLevel rename."""

    __tablename__ = "triage_assessments"

    care_episode_id: Mapped[str] = mapped_column(
        ForeignKey("care_episodes.id"), index=True
    )
    symptoms: Mapped[list[str]] = mapped_column(JSON)
    vitals: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    clinical_risk_level: Mapped[ClinicalRiskLevel] = mapped_column(
        SAEnum(ClinicalRiskLevel), index=True
    )
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    performed_by: Mapped[str] = mapped_column(String(36))
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sync_status: Mapped[SyncStatus] = mapped_column(SAEnum(SyncStatus), default=SyncStatus.PENDING)

    care_episode: Mapped["CareEpisode"] = relationship(back_populates="triage_assessments")


class Observation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """FHIR resource: Observation. Discrete clinical data points kept
    separate from TriageAssessment so richer observation history can
    accumulate across multiple encounters within one episode."""

    __tablename__ = "observations"

    care_episode_id: Mapped[str] = mapped_column(
        ForeignKey("care_episodes.id"), index=True
    )
    code: Mapped[str] = mapped_column(String(100))
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    care_episode: Mapped["CareEpisode"] = relationship(back_populates="observations")
