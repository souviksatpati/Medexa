import type { ContinuityRiskLevelT } from "@/models/careEpisode";

/**
 * CONTINUITY risk only. "How likely is this patient's care journey to
 * break, and what should be done about it?" This is the engine behind
 * Referral Rescue (canonical context Section 8) — explainable,
 * rule-based, and always paired with a recommended action, never a bare
 * score. A patient can be clinically low-risk and continuity-high-risk
 * at the same time; this file never looks at symptoms/vitals directly,
 * only at journey signals.
 */

interface ContinuityRiskInput {
  referralAcknowledged: boolean;
  referralOverdueSla: boolean;
  priorMissedFollowUp: boolean;
  longTravelDistance: boolean; // e.g. >20km to nearest appropriate facility
  poorConnectivityArea: boolean;
  receivingFacilityOverloaded: boolean;
  chronicCondition: boolean;
}

export interface ContinuityRiskResult {
  score: number;
  level: ContinuityRiskLevelT;
  reasons: string[];
  recommendedAction?: string;
}

export function computeContinuityRisk(input: ContinuityRiskInput): ContinuityRiskResult {
  const reasons: string[] = [];
  let score = 0;

  if (!input.referralAcknowledged) {
    score += 2;
    reasons.push("Referral not yet acknowledged");
  }
  if (input.referralOverdueSla) {
    score += 3;
    reasons.push("Referral not acknowledged within SLA");
  }
  if (input.priorMissedFollowUp) {
    score += 2;
    reasons.push("Previous follow-up was missed");
  }
  if (input.longTravelDistance) {
    score += 1;
    reasons.push("Long travel distance to appropriate facility");
  }
  if (input.poorConnectivityArea) {
    score += 1;
    reasons.push("Patient's area has poor connectivity");
  }
  if (input.receivingFacilityOverloaded) {
    score += 2;
    reasons.push("Receiving facility currently overloaded");
  }
  if (input.chronicCondition) {
    score += 1;
    reasons.push("Chronic condition requiring continued monitoring");
  }

  const level: ContinuityRiskLevelT = score >= 6 ? "high" : score >= 3 ? "medium" : "low";

  let recommendedAction: string | undefined;
  if (level === "high") {
    recommendedAction = "Escalate referral to supervisor";
  } else if (level === "medium") {
    recommendedAction = "Notify referring worker to follow up";
  }

  return { score, level, reasons, recommendedAction };
}
