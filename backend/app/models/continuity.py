from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum, JSON, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin

"""
Everything in this file is new relative to the earlier Care Continuity
backend — it implements MEDEXA_CANONICAL_PROJECT_CONTEXT.md Sections 8
(Referral Rescue), 9 (Back-Referral), 12 (SLA), 13 (Failure Reasons), and
16 (Continuity Risk, kept structurally separate from clinical risk).
"""


class ContinuityRiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ContinuityRiskScore(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    One row per computation, not a single mutable field on CareEpisode —
    keeping a history lets the dashboard show risk trending over time
    and gives an audit trail for "why was this patient flagged" that
    survives even if the underlying factors later change.
    """

    __tablename__ = "continuity_risk_scores"

    care_episode_id: Mapped[str] = mapped_column(ForeignKey("care_episodes.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    level: Mapped[ContinuityRiskLevel] = mapped_column(SAEnum(ContinuityRiskLevel), index=True)
    reasons: Mapped[list[str]] = mapped_column(JSON)  # always explainable — never a bare score
    recommended_action: Mapped[str | None] = mapped_column(String(255), nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ReferralFailureReason(str, enum.Enum):
    FACILITY_FULL = "facility_full"
    SPECIALIST_UNAVAILABLE = "specialist_unavailable"
    PATIENT_COULD_NOT_TRAVEL = "patient_could_not_travel"
    CONNECTIVITY_FAILURE = "connectivity_failure"
    APPOINTMENT_UNAVAILABLE = "appointment_unavailable"
    PATIENT_NO_SHOW = "patient_no_show"
    COST_TRAVEL_BARRIER = "cost_travel_barrier"
    REFERRAL_REJECTED = "referral_rejected"
    WRONG_FACILITY = "wrong_facility"
    OTHER = "other"


class ReferralSla(Base, UUIDPrimaryKeyMixin):
    """
    One row per referral (1:1), computed at referral-creation time from
    configurable SLA windows (app/core/config.py). Each *_due_at field is
    nullable because not every referral reaches every stage — e.g. a
    REJECTED referral never gets a consultation_due_at.
    """

    __tablename__ = "referral_slas"

    referral_id: Mapped[str] = mapped_column(ForeignKey("referrals.id"), unique=True, index=True)
    acknowledgement_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    appointment_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consultation_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    back_referral_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    follow_up_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    referral: Mapped["Referral"] = relationship(back_populates="sla")


class RescueActionType(str, enum.Enum):
    NOTIFY_REFERRING_WORKER = "notify_referring_worker"
    ESCALATE_TO_SUPERVISOR = "escalate_to_supervisor"
    CREATE_PRIORITY_FOLLOW_UP = "create_priority_follow_up"
    SUGGEST_ALTERNATE_FACILITY = "suggest_alternate_facility"


class ReferralRescueAction(Base, UUIDPrimaryKeyMixin):
    """
    "Operational continuity intelligence, not autonomous clinical
    diagnosis" (canonical context Section 8). A rescue action is a
    detected-and-logged recommendation, never an automatic clinical
    decision — it always names a reason (which SLA breached) and an
    action a human is expected to take.
    """

    __tablename__ = "referral_rescue_actions"

    referral_id: Mapped[str] = mapped_column(ForeignKey("referrals.id"), index=True)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str] = mapped_column(String(255))
    action_taken: Mapped[RescueActionType] = mapped_column(SAEnum(RescueActionType))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    referral: Mapped["Referral"] = relationship(back_populates="rescue_actions")


class BackReferral(Base, UUIDPrimaryKeyMixin):
    """
    Structured outcome returned from the receiving facility to the
    originating worker (canonical context Section 9). The referral does
    not conceptually end at "consultation completed" — it ends at
    outcome-returned + follow-up-assigned + episode-closed. One row per
    referral (1:1).
    """

    __tablename__ = "back_referrals"

    referral_id: Mapped[str] = mapped_column(ForeignKey("referrals.id"), unique=True, index=True)
    outcome: Mapped[str] = mapped_column(Text)
    treatment: Mapped[str | None] = mapped_column(Text, nullable=True)
    medication: Mapped[list[str]] = mapped_column(JSON, default=list)
    follow_up_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    warning_signs: Mapped[list[str]] = mapped_column(JSON, default=list)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[str] = mapped_column(String(36))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    referral: Mapped["Referral"] = relationship(back_populates="back_referral")


class FollowUpStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class FollowUpTask(Base, UUIDPrimaryKeyMixin):
    """Standalone follow-up tracking, independent of a specific referral
    (e.g. routine chronic-condition monitoring) — referral_id is
    optional precisely for that reason."""

    __tablename__ = "follow_up_tasks"

    care_episode_id: Mapped[str] = mapped_column(ForeignKey("care_episodes.id"), index=True)
    referral_id: Mapped[str | None] = mapped_column(ForeignKey("referrals.id"), nullable=True, index=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str] = mapped_column(String(255))
    assigned_to: Mapped[str] = mapped_column(String(36))
    status: Mapped[FollowUpStatus] = mapped_column(SAEnum(FollowUpStatus), default=FollowUpStatus.PENDING, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
