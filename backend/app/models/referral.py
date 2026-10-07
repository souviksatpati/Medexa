from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin
from app.models.observation import SyncStatus
from app.models.continuity import ReferralFailureReason


class ReferralState(str, enum.Enum):
    """
    Must stay byte-for-byte identical to the frontend's ReferralFullState
    + ReferralExceptionalState union in src/models/careEpisode.ts. This
    enum, not a free-text status column, is what makes illegal
    transitions structurally impossible to persist (Build Guide Section
    3 and Section 11's "enforced state machine, not a free-text status
    field").
    """

    DRAFT = "DRAFT"
    SENT = "SENT"
    RECEIVED = "RECEIVED"
    ACCEPTED = "ACCEPTED"
    APPOINTMENT_QUEUED = "APPOINTMENT_QUEUED"
    CONSULTED = "CONSULTED"
    REFERRED_BACK = "REFERRED_BACK"
    FOLLOW_UP_DUE = "FOLLOW_UP_DUE"
    FOLLOW_UP_COMPLETED = "FOLLOW_UP_COMPLETED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    PATIENT_NO_SHOW = "PATIENT_NO_SHOW"
    EMERGENCY_ESCALATED = "EMERGENCY_ESCALATED"


TERMINAL_STATES = {
    ReferralState.CLOSED,
    ReferralState.REJECTED,
    ReferralState.CANCELLED,
    ReferralState.EXPIRED,
}


class Referral(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """FHIR resource: ServiceRequest (referral variant). This is the hero
    workflow — Build Guide Section 1: "our system doesn't just create a
    referral, it follows the referral until the patient's care episode
    is closed." current_state is the live projection; the full history
    lives in ReferralStateTransition for audit + delay-metric purposes."""

    __tablename__ = "referrals"

    care_episode_id: Mapped[str] = mapped_column(
        ForeignKey("care_episodes.id"), index=True
    )
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    from_facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"))
    to_facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"), index=True)
    current_state: Mapped[ReferralState] = mapped_column(
        SAEnum(ReferralState), default=ReferralState.DRAFT, index=True
    )
    reason: Mapped[str] = mapped_column(Text)
    priority: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    created_by: Mapped[str] = mapped_column(String(36))
    sync_status: Mapped[SyncStatus] = mapped_column(SAEnum(SyncStatus), default=SyncStatus.PENDING)
    failure_reason: Mapped[ReferralFailureReason | None] = mapped_column(
        SAEnum(ReferralFailureReason), nullable=True
    )

    care_episode: Mapped["CareEpisode"] = relationship(back_populates="referrals")
    patient: Mapped["Patient"] = relationship()
    from_facility: Mapped["Facility"] = relationship(foreign_keys=[from_facility_id])
    to_facility: Mapped["Facility"] = relationship(foreign_keys=[to_facility_id])
    transitions: Mapped[list["ReferralStateTransition"]] = relationship(
        back_populates="referral", cascade="all, delete-orphan", order_by="ReferralStateTransition.changed_at"
    )
    sla: Mapped["ReferralSla | None"] = relationship(
        back_populates="referral", uselist=False, cascade="all, delete-orphan"
    )
    rescue_actions: Mapped[list["ReferralRescueAction"]] = relationship(
        back_populates="referral", cascade="all, delete-orphan", order_by="ReferralRescueAction.triggered_at"
    )
    back_referral: Mapped["BackReferral | None"] = relationship(
        back_populates="referral", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def patient_name(self) -> str | None:
        return self.patient.full_name if self.patient is not None else None

    @property
    def patient_village(self) -> str | None:
        return self.patient.village_or_ward if self.patient is not None else None

    @property
    def from_facility_name(self) -> str | None:
        return self.from_facility.name if self.from_facility is not None else None

    @property
    def to_facility_name(self) -> str | None:
        return self.to_facility.name if self.to_facility is not None else None

    @property
    def from_facility_district(self) -> str | None:
        return self.from_facility.district if self.from_facility is not None else None

    @property
    def to_facility_district(self) -> str | None:
        return self.to_facility.district if self.to_facility is not None else None

    @property
    def to_facility_subdistrict(self) -> str | None:
        return self.to_facility.subdistrict if self.to_facility is not None else None


class ReferralStateTransition(Base, UUIDPrimaryKeyMixin):
    """
    The audit trail for every state change. This table is what powers:
    - the referral-delay metric (T_completed - T_created) for free
    - the district dashboard's completion/compliance calculations
    - the "who changed what, when" requirement for patient-data audit
      logging (Build Guide Section 12)
    - sync-conflict analysis, via device_local_timestamp vs changed_at
      (server-received time)
    """

    __tablename__ = "referral_state_transitions"

    referral_id: Mapped[str] = mapped_column(ForeignKey("referrals.id"), index=True)
    from_state: Mapped[ReferralState | None] = mapped_column(SAEnum(ReferralState), nullable=True)
    to_state: Mapped[ReferralState] = mapped_column(SAEnum(ReferralState), index=True)
    changed_by: Mapped[str] = mapped_column(String(36))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))  # server-received
    device_local_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # worker's device clock at the moment of the offline action
    note: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    referral: Mapped["Referral"] = relationship(back_populates="transitions")
