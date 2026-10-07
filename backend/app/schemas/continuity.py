from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.continuity import (
    ContinuityRiskLevel,
    ReferralFailureReason,
    RescueActionType,
    FollowUpStatus,
)

"""
Schemas backing MEDEXA_CANONICAL_PROJECT_CONTEXT.md's Referral Rescue,
SLA, Back-Referral, and Continuity Risk concepts. Field names/types must
match the frontend's src/models/careEpisode.ts additions exactly, for
the same openapi-typescript reason as everywhere else in this codebase.
"""


class ContinuityRiskScoreRequest(BaseModel):
    """
    CONTINUITY risk only — "how likely is this patient's care journey to
    break?" Never mixed with clinical risk (schemas/triage.py). This
    engine looks at journey signals, not symptoms/vitals.
    """

    referral_acknowledged: bool
    referral_overdue_sla: bool
    prior_missed_follow_up: bool
    long_travel_distance: bool
    poor_connectivity_area: bool
    receiving_facility_overloaded: bool
    chronic_condition: bool


class ContinuityRiskScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    care_episode_id: str
    score: int
    level: ContinuityRiskLevel
    reasons: list[str]
    recommended_action: str | None
    computed_at: datetime


class ReferralSlaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    referral_id: str
    acknowledgement_due_at: datetime | None
    appointment_due_at: datetime | None
    consultation_due_at: datetime | None
    back_referral_due_at: datetime | None
    follow_up_due_at: datetime | None


class ReferralRescueActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    referral_id: str
    triggered_at: datetime
    reason: str
    action_taken: RescueActionType
    resolved_at: datetime | None


class BackReferralCreate(BaseModel):
    id: str
    referral_id: str
    outcome: str = Field(min_length=1)
    treatment: str | None = None
    medication: list[str] = Field(default_factory=list)
    follow_up_date: datetime | None = None
    warning_signs: list[str] = Field(default_factory=list)
    instructions: str | None = None
    recorded_by: str
    recorded_at: datetime


class BackReferralOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    referral_id: str
    outcome: str
    treatment: str | None
    medication: list[str]
    follow_up_date: datetime | None
    warning_signs: list[str]
    instructions: str | None
    recorded_by: str
    recorded_at: datetime


class ReferralFailureReasonRequest(BaseModel):
    """Body for PATCH /referrals/{id}/failure-reason — recording why a
    referral failed is a distinct action from a state transition, kept
    as its own small endpoint rather than overloading the transition
    payload (canonical context Section 13)."""

    failure_reason: ReferralFailureReason


class FollowUpTaskCreate(BaseModel):
    id: str
    care_episode_id: str
    referral_id: str | None = None
    due_at: datetime
    reason: str
    assigned_to: str
    status: FollowUpStatus = FollowUpStatus.PENDING
    completed_at: datetime | None = None


class FollowUpTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    care_episode_id: str
    referral_id: str | None
    due_at: datetime
    reason: str
    assigned_to: str
    status: FollowUpStatus
    completed_at: datetime | None
