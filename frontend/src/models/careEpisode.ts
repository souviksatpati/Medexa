import { z } from "zod";

/**
 * Medexa domain model. Care Episode remains the root entity — every
 * clinical record hangs off a careEpisodeId (see
 * MEDEXA_CANONICAL_PROJECT_CONTEXT.md Section 15).
 *
 * HARD RULE (Section 16 of the canonical context): clinical risk and
 * continuity risk are NEVER the same field, NEVER merged, and NEVER
 * rendered with the same badge component. Clinical risk asks "how
 * urgent is this patient's condition?" Continuity risk asks "how
 * likely is this patient's care journey to break?" A patient can be
 * ClinicalRiskLevel.LOW and ContinuityRiskLevel.HIGH simultaneously —
 * e.g. a stable chronic patient whose referral was never acknowledged
 * and who lives 40km from the nearest PHC. Keep these visually and
 * structurally distinct everywhere in the UI.
 */

export const PatientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1, "Name is required"),
  age: z.number().int().min(0).max(120),
  sex: z.enum(["male", "female", "other"]),
  villageOrWard: z.string().min(1),
  phone: z.string().optional(),
  chronicConditions: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});
export type Patient = z.infer<typeof PatientSchema>;

// --- Clinical risk (triage-time, patient-condition-specific) ---
export const ClinicalRiskLevel = z.enum(["low", "moderate", "high", "emergency"]);
export type ClinicalRiskLevelT = z.infer<typeof ClinicalRiskLevel>;

// --- Continuity risk (care-journey-specific, separate concept) ---
export const ContinuityRiskLevel = z.enum(["low", "medium", "high"]);
export type ContinuityRiskLevelT = z.infer<typeof ContinuityRiskLevel>;

export const ContinuityRiskFactorSchema = z.object({
  factor: z.string(),
  weight: z.number(),
});

export const ContinuityRiskScoreSchema = z.object({
  careEpisodeId: z.string().uuid(),
  score: z.number(),
  level: ContinuityRiskLevel,
  reasons: z.array(z.string()), // explainable, always — see canonical context Section 16
  recommendedAction: z.string().optional(),
  computedAt: z.string().datetime(),
});
export type ContinuityRiskScore = z.infer<typeof ContinuityRiskScoreSchema>;

export const TriageAssessmentSchema = z.object({
  id: z.string().uuid(),
  careEpisodeId: z.string().uuid(),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  vitals: z
    .object({
      systolicBP: z.number().optional(),
      diastolicBP: z.number().optional(),
      pulse: z.number().optional(),
      tempC: z.number().optional(),
      spo2: z.number().min(0).max(100).optional(),
    })
    .optional(),
  clinicalRiskLevel: ClinicalRiskLevel,
  notes: z.string().optional(),
  performedBy: z.string(),
  performedAt: z.string().datetime(),
  syncStatus: z.enum(["synced", "pending", "conflict"]).default("pending"),
});
export type TriageAssessment = z.infer<typeof TriageAssessmentSchema>;

/**
 * Referral lifecycle states. Unchanged from the enforced backend state
 * machine — the canonical context's Section 8 ("Referral Rescue") is an
 * intelligence/detection layer ON TOP of this state machine, not a
 * replacement for it. Rescue actions are triggered by SLA breaches
 * within a state, they do not introduce new states.
 */
export const ReferralFullState = z.enum([
  "DRAFT",
  "SENT",
  "RECEIVED",
  "ACCEPTED",
  "APPOINTMENT_QUEUED",
  "CONSULTED",
  "REFERRED_BACK",
  "FOLLOW_UP_DUE",
  "FOLLOW_UP_COMPLETED",
  "CLOSED",
]);

export const ReferralExceptionalState = z.enum([
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "PATIENT_NO_SHOW",
  "EMERGENCY_ESCALATED",
]);

export const ReferralState = z.union([ReferralFullState, ReferralExceptionalState]);
export type ReferralStateT = z.infer<typeof ReferralState>;

export const ReferralStateTransitionSchema = z.object({
  id: z.string().uuid(),
  referralId: z.string().uuid(),
  fromState: ReferralState.nullable(),
  toState: ReferralState,
  changedBy: z.string(),
  changedAt: z.string().datetime(),
  deviceLocalTimestamp: z.string().datetime().optional(),
  note: z.string().optional(),
});
export type ReferralStateTransition = z.infer<typeof ReferralStateTransitionSchema>;

/**
 * Referral failure reasons (canonical context Section 13). Stored on the
 * referral, not just inferred — this is what turns the dashboard's
 * "why are referrals failing" view from a guess into real intelligence.
 */
export const ReferralFailureReason = z.enum([
  "facility_full",
  "specialist_unavailable",
  "patient_could_not_travel",
  "connectivity_failure",
  "appointment_unavailable",
  "patient_no_show",
  "cost_travel_barrier",
  "referral_rejected",
  "wrong_facility",
  "other",
]);
export type ReferralFailureReasonT = z.infer<typeof ReferralFailureReason>;

/**
 * Referral SLA (canonical context Section 12). Expected time windows
 * per stage — configurable, demo/business rules, not clinical
 * guidelines. Used to compute "at risk" / "breached" status shown on
 * the referral tracker and district dashboard.
 */
export const ReferralSlaSchema = z.object({
  referralId: z.string().uuid(),
  acknowledgementDueAt: z.string().datetime().optional(),
  appointmentDueAt: z.string().datetime().optional(),
  consultationDueAt: z.string().datetime().optional(),
  backReferralDueAt: z.string().datetime().optional(),
  followUpDueAt: z.string().datetime().optional(),
});
export type ReferralSla = z.infer<typeof ReferralSlaSchema>;

export type SlaStatus = "on_track" | "at_risk" | "breached";

/**
 * Referral Rescue action (canonical context Section 8) — this is
 * "operational continuity intelligence, not autonomous clinical
 * diagnosis." A rescue action is a recommendation + log entry, never an
 * automatic clinical decision.
 */
export const ReferralRescueActionSchema = z.object({
  id: z.string().uuid(),
  referralId: z.string().uuid(),
  triggeredAt: z.string().datetime(),
  reason: z.string(), // e.g. "Acknowledgement SLA breached"
  actionTaken: z.enum([
    "notify_referring_worker",
    "escalate_to_supervisor",
    "create_priority_follow_up",
    "suggest_alternate_facility",
  ]),
  resolvedAt: z.string().datetime().optional(),
});
export type ReferralRescueAction = z.infer<typeof ReferralRescueActionSchema>;

/**
 * Back-referral packet (canonical context Section 9) — structured
 * outcome information returned from the receiving facility to the
 * originating worker. The referral does not end at "consultation
 * completed"; it ends at outcome-returned + follow-up-assigned +
 * episode-closed.
 */
export const BackReferralSchema = z.object({
  id: z.string().uuid(),
  referralId: z.string().uuid(),
  outcome: z.string().min(1),
  treatment: z.string().optional(),
  medication: z.array(z.string()).default([]),
  followUpDate: z.string().datetime().optional(),
  warningSigns: z.array(z.string()).default([]),
  instructions: z.string().optional(),
  recordedBy: z.string(),
  recordedAt: z.string().datetime(),
});
export type BackReferral = z.infer<typeof BackReferralSchema>;

export const FollowUpTaskSchema = z.object({
  id: z.string().uuid(),
  careEpisodeId: z.string().uuid(),
  referralId: z.string().uuid().optional(),
  dueAt: z.string().datetime(),
  reason: z.string(),
  assignedTo: z.string(),
  status: z.enum(["pending", "completed", "overdue"]),
  completedAt: z.string().datetime().optional(),
});
export type FollowUpTask = z.infer<typeof FollowUpTaskSchema>;

export const ReferralSchema = z.object({
  id: z.string().uuid(),
  careEpisodeId: z.string().uuid(),
  patientId: z.string().uuid(),
  fromFacilityId: z.string(),
  toFacilityId: z.string(),
  currentState: ReferralState,
  reason: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  history: z.array(ReferralStateTransitionSchema).default([]),
  sla: ReferralSlaSchema.optional(),
  failureReason: ReferralFailureReason.optional(),
  rescueActions: z.array(ReferralRescueActionSchema).default([]),
  backReferral: BackReferralSchema.optional(),
  syncStatus: z.enum(["synced", "pending", "conflict"]).default("pending"),
});
export type Referral = z.infer<typeof ReferralSchema>;

export const CareEpisodeSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  status: z.enum(["open", "closed"]),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
  triage: TriageAssessmentSchema.optional(),
  referral: ReferralSchema.optional(),
  continuityRisk: ContinuityRiskScoreSchema.optional(),
  followUps: z.array(FollowUpTaskSchema).default([]),
  syncStatus: z.enum(["synced", "pending", "conflict"]).default("pending"),
});
export type CareEpisode = z.infer<typeof CareEpisodeSchema>;

export interface ActiveCareContext {
  patientId: string;
  patientName: string;
  ageGender?: string;
  village?: string;
  phone?: string;
  careEpisodeId: string;
  triageAssessmentId?: string;
  referralId?: string;
}
