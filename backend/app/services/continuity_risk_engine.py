from app.core.config import settings
from app.models.continuity import ContinuityRiskLevel
from app.schemas.continuity import ContinuityRiskScoreRequest, ContinuityRiskScoreOut

"""
CONTINUITY risk only — "how likely is this patient's care journey to
break, and what should be done about it?" Mirrors the frontend's
src/utils/continuityRiskEngine.ts. Explainable and rule-based, always
paired with a recommended action, never a bare score — this is the
engine behind Referral Rescue (canonical context Section 8). Never
looks at symptoms/vitals directly, only journey signals.
"""


def compute_continuity_risk(
    payload: ContinuityRiskScoreRequest,
) -> tuple[int, ContinuityRiskLevel, list[str], str | None]:
    reasons: list[str] = []
    score = 0

    if not payload.referral_acknowledged:
        score += 2
        reasons.append("Referral not yet acknowledged")
    if payload.referral_overdue_sla:
        score += 3
        reasons.append("Referral not acknowledged within SLA")
    if payload.prior_missed_follow_up:
        score += 2
        reasons.append("Previous follow-up was missed")
    if payload.long_travel_distance:
        score += 1
        reasons.append("Long travel distance to appropriate facility")
    if payload.poor_connectivity_area:
        score += 1
        reasons.append("Patient's area has poor connectivity")
    if payload.receiving_facility_overloaded:
        score += 2
        reasons.append("Receiving facility currently overloaded")
    if payload.chronic_condition:
        score += 1
        reasons.append("Chronic condition requiring continued monitoring")

    if score >= settings.continuity_risk_high_threshold:
        level = ContinuityRiskLevel.HIGH
    elif score >= settings.continuity_risk_medium_threshold:
        level = ContinuityRiskLevel.MEDIUM
    else:
        level = ContinuityRiskLevel.LOW

    recommended_action: str | None = None
    if level == ContinuityRiskLevel.HIGH:
        recommended_action = "Escalate referral to supervisor"
    elif level == ContinuityRiskLevel.MEDIUM:
        recommended_action = "Notify referring worker to follow up"

    return score, level, reasons, recommended_action
