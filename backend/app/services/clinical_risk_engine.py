from app.core.config import settings
from app.models.observation import ClinicalRiskLevel
from app.schemas.triage import ClinicalRiskScoreRequest, ClinicalRiskScoreResponse

"""
CLINICAL risk only — "how urgent is this patient's condition right now?"
Mirrors the frontend's src/utils/clinicalRiskEngine.ts. Never mix this
file's logic with continuity_risk_engine.py — MEDEXA_CANONICAL_PROJECT_
CONTEXT.md Section 16 is a hard rule on this separation. This engine has
no knowledge of referrals, SLAs, or facility load; it only sees
symptoms and vitals.

UPGRADE PATH: replace compute_clinical_risk()'s body with a trained
model + SHAP explainer once Phases 1-6 are solid. Signature stays
identical so nothing calling this needs to change.
"""

EMERGENCY_SYMPTOMS = {
    "chest pain",
    "severe bleeding",
    "unconscious",
    "difficulty breathing",
    "seizure",
}

HIGH_RISK_SYMPTOMS = {"breathlessness", "high fever", "severe pain", "vomiting blood"}


def compute_clinical_risk(payload: ClinicalRiskScoreRequest) -> ClinicalRiskScoreResponse:
    symptoms_lower = {s.lower() for s in payload.symptoms}
    factors: list[str] = []

    if symptoms_lower & EMERGENCY_SYMPTOMS:
        return ClinicalRiskScoreResponse(
            clinical_risk_level=ClinicalRiskLevel.EMERGENCY,
            score=99,
            contributing_factors=["Emergency symptom reported"],
        )

    score = 0

    if symptoms_lower & HIGH_RISK_SYMPTOMS:
        score += 3
        factors.append("High-risk symptom reported")

    if payload.vitals:
        v = payload.vitals
        if v.spo2 is not None and v.spo2 < 92:
            score += 3
            factors.append("Low SpO2 (<92%)")
        if v.systolic_bp is not None and v.systolic_bp > 160:
            score += 2
            factors.append("Elevated systolic BP (>160)")
        if v.temp_c is not None and v.temp_c > 39:
            score += 2
            factors.append("High fever (>39°C)")
        if v.pulse is not None and (v.pulse > 120 or v.pulse < 50):
            score += 2
            factors.append("Abnormal pulse rate")

    if score >= settings.clinical_risk_high_threshold:
        level = ClinicalRiskLevel.HIGH
    elif score >= settings.clinical_risk_moderate_threshold:
        level = ClinicalRiskLevel.MODERATE
    else:
        level = ClinicalRiskLevel.LOW

    return ClinicalRiskScoreResponse(clinical_risk_level=level, score=score, contributing_factors=factors)
