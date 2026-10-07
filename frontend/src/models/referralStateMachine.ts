import type { ReferralStateT } from "./careEpisode";

/**
 * This table is a MIRROR of the backend's authoritative transition rules.
 * It exists so the UI only ever presents legal next-actions to the user
 * (better UX, fewer wasted taps) — but the backend re-validates every
 * transition independently. Never trust this file alone for correctness;
 * see Build Guide Section 3 and Section 11 (server-side enforcement).
 */
export const LEGAL_TRANSITIONS: Record<ReferralStateT, ReferralStateT[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["RECEIVED", "ACCEPTED", "REJECTED", "EXPIRED", "EMERGENCY_ESCALATED"],
  RECEIVED: ["ACCEPTED", "REJECTED", "EMERGENCY_ESCALATED"],
  ACCEPTED: ["APPOINTMENT_QUEUED", "CONSULTED", "PATIENT_NO_SHOW", "EMERGENCY_ESCALATED"],
  APPOINTMENT_QUEUED: ["CONSULTED", "PATIENT_NO_SHOW", "EMERGENCY_ESCALATED"],
  CONSULTED: ["REFERRED_BACK", "FOLLOW_UP_DUE", "CLOSED"],
  REFERRED_BACK: ["FOLLOW_UP_DUE", "CLOSED"],
  FOLLOW_UP_DUE: ["FOLLOW_UP_COMPLETED", "PATIENT_NO_SHOW"],
  FOLLOW_UP_COMPLETED: ["CLOSED"],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  PATIENT_NO_SHOW: ["SENT"], // allow re-referral after a no-show
  EMERGENCY_ESCALATED: ["ACCEPTED", "CLOSED"],
};

export function isLegalTransition(
  from: ReferralStateT,
  to: ReferralStateT
): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAvailableTransitions(
  current: ReferralStateT
): ReferralStateT[] {
  return LEGAL_TRANSITIONS[current] ?? [];
}

export const TERMINAL_STATES: ReferralStateT[] = [
  "CLOSED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
];

export function isTerminal(state: ReferralStateT): boolean {
  return TERMINAL_STATES.includes(state);
}

/** Human-readable labels for the UI — keep display concerns out of the model. */
export const STATE_LABELS: Record<ReferralStateT, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  RECEIVED: "Received",
  ACCEPTED: "Accepted",
  APPOINTMENT_QUEUED: "Appointment Queued",
  CONSULTED: "Consulted",
  REFERRED_BACK: "Referred Back",
  FOLLOW_UP_DUE: "Follow-up Due",
  FOLLOW_UP_COMPLETED: "Follow-up Completed",
  CLOSED: "Closed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  PATIENT_NO_SHOW: "No-Show",
  EMERGENCY_ESCALATED: "Emergency Escalated",
};
