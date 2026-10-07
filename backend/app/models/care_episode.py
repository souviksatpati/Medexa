from datetime import datetime
from sqlalchemy import String, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class CareEpisodeStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class CareEpisode(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    THE root domain entity (Build Guide Section 2). Every clinical record
    — Encounter, TriageAssessment, Referral, Observation — has a foreign
    key back to care_episode_id. This is what makes "show me this
    patient's full journey" a single query instead of manually stitched
    joins across scattered tables, and it's the structural backbone of
    the entire Care Continuity thesis.

    FHIR alignment: loosely maps to FHIR's EpisodeOfCare resource.
    """

    __tablename__ = "care_episodes"

    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    status: Mapped[CareEpisodeStatus] = mapped_column(
        SAEnum(CareEpisodeStatus), default=CareEpisodeStatus.OPEN, index=True
    )
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="care_episodes")
    encounters: Mapped[list["Encounter"]] = relationship(
        back_populates="care_episode", cascade="all, delete-orphan"
    )
    triage_assessments: Mapped[list["TriageAssessment"]] = relationship(
        back_populates="care_episode", cascade="all, delete-orphan"
    )
    referrals: Mapped[list["Referral"]] = relationship(
        back_populates="care_episode", cascade="all, delete-orphan"
    )
    observations: Mapped[list["Observation"]] = relationship(
        back_populates="care_episode", cascade="all, delete-orphan"
    )
    continuity_risk_scores: Mapped[list["ContinuityRiskScore"]] = relationship(
        cascade="all, delete-orphan", order_by="ContinuityRiskScore.computed_at"
    )
    follow_ups: Mapped[list["FollowUpTask"]] = relationship(
        cascade="all, delete-orphan", order_by="FollowUpTask.due_at"
    )
