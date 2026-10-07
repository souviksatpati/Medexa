"""
Import every model here so Alembic's env.py (which imports this module)
sees the full metadata for autogenerate. Keep this list exhaustive.
"""
from app.models.user import User, UserRole  # noqa: F401
from app.models.geography import District, Subdistrict, Block, LocalBody, Location  # noqa: F401
from app.models.facility import Facility, FacilityType, AvailabilityLevel, CoordinateStatus  # noqa: F401
from app.models.facility_service import FacilityService, CapacityStatus  # noqa: F401
from app.models.patient import Patient, Sex  # noqa: F401
from app.models.care_episode import CareEpisode, CareEpisodeStatus  # noqa: F401
from app.models.encounter import Encounter  # noqa: F401
from app.models.observation import Observation, TriageAssessment, ClinicalRiskLevel, SyncStatus  # noqa: F401
from app.models.referral import Referral, ReferralState, ReferralStateTransition, TERMINAL_STATES  # noqa: F401
from app.models.continuity import (  # noqa: F401
    ContinuityRiskLevel,
    ContinuityRiskScore,
    ReferralFailureReason,
    ReferralSla,
    RescueActionType,
    ReferralRescueAction,
    BackReferral,
    FollowUpStatus,
    FollowUpTask,
)
from app.models.audit_log import AuditLog  # noqa: F401
