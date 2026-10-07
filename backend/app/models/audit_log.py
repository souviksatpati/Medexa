from datetime import datetime
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class AuditLog(Base, UUIDPrimaryKeyMixin):
    """
    Generic audit trail for patient-record changes outside the referral
    state machine (which has its own dedicated ReferralStateTransition
    table for richer tracking). Every write to Patient/CareEpisode/
    TriageAssessment goes through here too — "who changed what, when" is
    a real requirement for a system handling patient data, not paranoia
    (Build Guide Section 11).
    """

    __tablename__ = "audit_logs"

    entity_type: Mapped[str] = mapped_column(String(50), index=True)  # "patient", "care_episode", etc.
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    action: Mapped[str] = mapped_column(String(20))  # "create" | "update"
    changed_by: Mapped[str] = mapped_column(String(36))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    diff: Mapped[dict | None] = mapped_column(JSON, nullable=True)
