from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.referral import ReferralState
from app.models.observation import SyncStatus
from app.models.continuity import ReferralFailureReason
from app.schemas.continuity import ReferralSlaOut, ReferralRescueActionOut, BackReferralOut


class ReferralCreate(BaseModel):
    id: str
    care_episode_id: str
    patient_id: str
    from_facility_id: str
    to_facility_id: str
    current_state: ReferralState = ReferralState.DRAFT
    reason: str = Field(min_length=1)
    priority: str | None = None
    created_at: datetime
    created_by: str
    sync_status: SyncStatus = SyncStatus.PENDING


class ReferralStateTransitionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    referral_id: str
    from_state: ReferralState | None
    to_state: ReferralState
    changed_by: str
    changed_at: datetime
    device_local_timestamp: datetime | None
    note: str | None


class ReferralOut(BaseModel):
    id: str
    care_episode_id: str
    patient_id: str
    from_facility_id: str
    to_facility_id: str
    current_state: ReferralState
    reason: str
    priority: str | None = None
    patient_name: str | None = None
    patient_village: str | None = None
    from_facility_name: str | None = None
    to_facility_name: str | None = None
    from_facility_district: str | None = None
    to_facility_district: str | None = None
    to_facility_subdistrict: str | None = None
    created_at: datetime
    created_by: str
    sync_status: SyncStatus
    failure_reason: ReferralFailureReason | None = None
    history: list[ReferralStateTransitionOut] = Field(default_factory=list, alias="transitions")
    sla: ReferralSlaOut | None = None
    rescue_actions: list[ReferralRescueActionOut] = Field(default_factory=list)
    back_referral: BackReferralOut | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ReferralTransitionRequest(BaseModel):
    """
    Body for PATCH /referrals/{id}/transition. changed_by comes from the
    authenticated user (via JWT), not the request body, to prevent a
    worker from spoofing another user's identity in the audit trail.
    """

    id: str  # transition record id, generated client-side for offline-first idempotency
    to_state: ReferralState
    device_local_timestamp: datetime | None = None
    note: str | None = None

