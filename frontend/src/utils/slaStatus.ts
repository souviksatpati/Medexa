import type { SlaStatus } from "@/models/careEpisode";

/**
 * Pure function, no side effects — used by ReferralTracker for the SLA
 * badge and by the dashboard for aggregate SLA compliance. "At risk"
 * means within 25% of the deadline, not yet breached — gives workers a
 * warning window before a hard breach, matching the Rescue Engine's
 * detect-before-fail intent (canonical context Section 8).
 */
export function computeSlaStatus(dueAt: string | undefined, now: Date = new Date()): SlaStatus | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const totalWindowMs = due.getTime() - now.getTime();

  if (totalWindowMs <= 0) return "breached";

  const atRiskThresholdMs = 1000 * 60 * 60 * 2; // within 2 hours of deadline = at risk
  if (totalWindowMs <= atRiskThresholdMs) return "at_risk";

  return "on_track";
}

export function formatTimeRemaining(dueAt: string | undefined, now: Date = new Date()): string {
  if (!dueAt) return "";
  const due = new Date(dueAt);
  const diffMs = due.getTime() - now.getTime();
  const absHours = Math.abs(diffMs) / (1000 * 60 * 60);

  if (diffMs <= 0) {
    return absHours < 1
      ? `Overdue by ${Math.round(absHours * 60)}m`
      : `Overdue by ${absHours.toFixed(1)}h`;
  }
  return absHours < 1 ? `${Math.round(absHours * 60)}m remaining` : `${absHours.toFixed(1)}h remaining`;
}
