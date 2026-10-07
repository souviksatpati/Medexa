from pydantic import BaseModel


class FacilityContinuityMetrics(BaseModel):
    """Matches the frontend's FacilityContinuityTable props exactly."""

    facility_id: str
    facility_name: str
    total_referrals: int
    completion_rate_percent: float
    avg_referral_delay_hours: float
    follow_up_compliance_percent: float


class DashboardResponse(BaseModel):
    """
    Matches the frontend's DashboardData interface exactly
    (src/pages/DistrictDashboardPage.tsx). All numbers here are computed
    server-side from Referral + ReferralStateTransition timestamps —
    Build Guide Section 5's exact formulas, not re-derived ad hoc on the
    frontend.
    """

    total_referrals: int
    accepted: int
    completed: int
    follow_up_completed: int
    overdue: int
    no_show: int
    total_eligible_for_completion: int
    follow_ups_due: int
    data_freshness_minutes_ago: int
    facilities: list[FacilityContinuityMetrics]


class ContinuityRiskPatient(BaseModel):
    """Powers the district dashboard's Continuity Risk view (Section 2.4
    of the Stitch UI prompt) — always includes contributing_factors so
    the flag is explainable, never a bare score."""

    patient_id: str
    patient_name: str
    care_episode_id: str
    risk_level: str  # "medium" | "high"
    score: int
    contributing_factors: list[str]
