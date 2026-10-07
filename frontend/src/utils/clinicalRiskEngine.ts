import type { ClinicalRiskLevelT } from "@/models/careEpisode";

/**
 * CLINICAL risk & Digital Triage Scoring Engine.
 * "How urgent is this patient's condition right now?"
 * Produces clinically defensible triage tiers:
 * - RED (Emergency — refer immediately)
 * - YELLOW (High priority — refer within 24h)
 * - GREEN (Routine — monitor / routine follow-up)
 */

export type TriageTier = "RED" | "YELLOW" | "GREEN";

export interface TriageVitals {
  systolicBP?: number;
  diastolicBP?: number;
  pulse?: number;
  tempC?: number;
  spo2?: number;
}

export interface TriageRiskResult {
  tier: TriageTier;
  level: ClinicalRiskLevelT;
  score: number;
  explanation: string;
  recommendedAction: string;
  isEmergency: boolean;
  triggers: string[];
}

export interface ClinicalRiskInput {
  symptoms: string[];
  vitals: TriageVitals;
}

// Symptom severity weights
export const SYMPTOM_WEIGHTS: Record<string, number> = {
  "chest pain": 4,
  "severe bleeding": 5,
  "unconscious": 5,
  "seizure": 5,
  "difficulty breathing": 4,
  "breathlessness": 3,
  "vomiting blood": 4,
  "severe pain": 3,
  "high fever": 2,
  "fever": 2,
  "vomiting": 2,
  "cough": 1,
};

/**
 * Computes clinically defensible triage outcome based on entered symptoms and vitals.
 */
export function calculateTriageRisk(
  symptoms: string[],
  vitals: TriageVitals = {}
): TriageRiskResult {
  const symptomsLower = symptoms.map((s) => s.trim().toLowerCase());
  const triggers: string[] = [];
  let score = 0;
  let immediateRed = false;

  // 1. Critical Symptoms / Emergency Triggers
  const hasChestPain = symptomsLower.some((s) => s.includes("chest pain"));
  const hasBreathlessness = symptomsLower.some(
    (s) => s.includes("breathlessness") || s.includes("difficulty breathing")
  );

  if (hasChestPain && hasBreathlessness) {
    immediateRed = true;
    triggers.push("Chest pain combined with acute breathlessness (Cardiopulmonary emergency)");
  }

  if (symptomsLower.some((s) => s.includes("unconscious") || s.includes("seizure") || s.includes("severe bleeding"))) {
    immediateRed = true;
    triggers.push("Severe acute neurological/hemorrhagic symptoms detected");
  }

  // Calculate symptom scores from defined weights
  symptomsLower.forEach((sym) => {
    let matchedWeight = 0;
    for (const [sKey, weight] of Object.entries(SYMPTOM_WEIGHTS)) {
      if (sym.includes(sKey)) {
        matchedWeight = Math.max(matchedWeight, weight);
      }
    }
    score += matchedWeight;
  });

  // 2. Vitals Thresholds
  if (vitals.spo2 !== undefined && vitals.spo2 > 0) {
    if (vitals.spo2 < 92) {
      immediateRed = true;
      score += 4;
      triggers.push(`Critical hypoxia: SpO2 ${vitals.spo2}% (< 92%)`);
    } else if (vitals.spo2 <= 94) {
      score += 2;
      triggers.push(`Borderline oxygenation: SpO2 ${vitals.spo2}%`);
    }
  }

  if (vitals.systolicBP !== undefined && vitals.systolicBP > 0) {
    if (vitals.systolicBP < 90) {
      immediateRed = true;
      score += 4;
      triggers.push(`Hypotension / Shock: Systolic BP ${vitals.systolicBP} mmHg (< 90)`);
    } else if (vitals.systolicBP > 160) {
      immediateRed = true;
      score += 4;
      triggers.push(`Severe Hypertensive Crisis: Systolic BP ${vitals.systolicBP} mmHg (> 160)`);
    } else if (vitals.systolicBP > 140) {
      score += 2;
      triggers.push(`Elevated blood pressure: Systolic BP ${vitals.systolicBP} mmHg`);
    }
  }

  if (vitals.pulse !== undefined && vitals.pulse > 0) {
    if (vitals.pulse > 120) {
      score += 2;
      triggers.push(`Tachycardia: Pulse ${vitals.pulse} bpm (> 120)`);
    } else if (vitals.pulse < 50) {
      score += 2;
      triggers.push(`Bradycardia: Pulse ${vitals.pulse} bpm (< 50)`);
    }
  }

  if (vitals.tempC !== undefined && vitals.tempC > 0) {
    if (vitals.tempC >= 39.0) {
      score += 2;
      triggers.push(`High pyrexia: Temperature ${vitals.tempC}°C (≥ 39°C)`);
    } else if (vitals.tempC >= 38.0) {
      score += 1;
      triggers.push(`Fever: Temperature ${vitals.tempC}°C`);
    }
  }

  // 3. Assign Tier & Recommendations
  if (immediateRed || score >= 6) {
    const mainTrigger = triggers[0] || "Severe symptoms and abnormal vital signs recorded";
    return {
      tier: "RED",
      level: "emergency",
      score,
      explanation: `${mainTrigger} — patient is clinically unstable and requires immediate emergency escalation.`,
      recommendedAction: "Refer to Block PHC/CHC or District Hospital immediately via 108 Emergency Dispatch.",
      isEmergency: true,
      triggers,
    };
  }

  if (score >= 3) {
    const mainTrigger = triggers[0] || "Multiple symptomatic complaints or mild vital abnormalities";
    return {
      tier: "YELLOW",
      level: "high",
      score,
      explanation: `${mainTrigger} — clinical assessment indicates priority medical consultation needed within 24 hours.`,
      recommendedAction: "Schedule priority referral to Block Medical Officer within 24 hours.",
      isEmergency: false,
      triggers,
    };
  }

  return {
    tier: "GREEN",
    level: "low",
    score,
    explanation: symptoms.length > 0 
      ? "Mild, isolated symptoms with stable vital signs — no critical indicators found."
      : "Baseline assessment normal — no acute distress identified.",
    recommendedAction: "Routine community follow-up and symptomatic home care by village ASHA.",
    isEmergency: false,
    triggers: triggers.length > 0 ? triggers : ["Vitals and presentation within normal limits"],
  };
}

/**
 * Backwards compatibility helper for existing code referencing computeClinicalRisk
 */
export function computeClinicalRisk(input: ClinicalRiskInput): ClinicalRiskLevelT {
  return calculateTriageRisk(input.symptoms, input.vitals).level;
}
