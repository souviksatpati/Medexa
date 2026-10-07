import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Referral, ReferralStateT } from "@/models/careEpisode";
import { getAvailableTransitions, isTerminal, STATE_LABELS } from "@/models/referralStateMachine";
import { db, writeAndQueue } from "@/sync/db";
import { computeSlaStatus, formatTimeRemaining } from "@/utils/slaStatus";

interface ReferralTrackerProps {
  referral: Referral;
  changedBy: string;
}

const STATE_ICONS: Partial<Record<ReferralStateT, string>> = {
  DRAFT: "edit_note",
  SENT: "send",
  RECEIVED: "move_to_inbox",
  ACCEPTED: "check_circle",
  APPOINTMENT_QUEUED: "event",
  CONSULTED: "stethoscope",
  REFERRED_BACK: "keyboard_return",
  FOLLOW_UP_DUE: "schedule",
  FOLLOW_UP_COMPLETED: "task_alt",
  CLOSED: "lock",
  REJECTED: "cancel",
  CANCELLED: "block",
  EXPIRED: "hourglass_disabled",
  PATIENT_NO_SHOW: "person_off",
  EMERGENCY_ESCALATED: "emergency",
};

const STATE_BADGE_TONE: Partial<Record<ReferralStateT, string>> = {
  DRAFT: "bg-surface-container text-on-surface-variant border-outline-variant",
  SENT: "bg-secondary-container text-on-secondary-container border-secondary/20",
  ACCEPTED: "bg-amber-accent/10 text-amber-800 border-amber-accent/30",
  CONSULTED: "bg-primary-container/20 text-primary border-primary/30",
  FOLLOW_UP_DUE: "bg-amber-accent/10 text-amber-800 border-amber-accent/30",
  FOLLOW_UP_COMPLETED: "bg-green-accent/10 text-green-accent border-green-accent/30",
  CLOSED: "bg-green-accent/10 text-green-accent border-green-accent/30",
  REJECTED: "bg-error-container text-on-error-container border-error/30",
  EMERGENCY_ESCALATED: "bg-error-container text-on-error-container border-error",
};

const SLA_STATUS_STYLES = {
  on_track: "bg-green-accent/10 text-green-accent",
  at_risk: "bg-amber-accent/10 text-amber-accent",
  breached: "bg-red-accent/10 text-red-accent",
};

/**
 * Matches the Stitch "Referral Tracker" screen: status badges row, then
 * a vertical timeline with connector lines (see .timeline-line in
 * globals.css), then only the legally-available next actions.
 *
 * Adds two things beyond the original Stitch screen, per the canonical
 * context: an SLA countdown badge (Section 12) and a Rescue Action
 * banner (Section 8) when one has fired — these are the literal UI
 * surface of Medexa's Referral Rescue differentiator, so they get
 * dedicated visual treatment, not an afterthought tucked into the
 * timeline.
 */
export function ReferralTracker({ referral, changedBy }: ReferralTrackerProps) {
  const [note, setNote] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const availableTransitions = getAvailableTransitions(referral.currentState);
  const terminal = isTerminal(referral.currentState);

  const nextSlaDueAt =
    referral.sla?.acknowledgementDueAt ??
    referral.sla?.appointmentDueAt ??
    referral.sla?.consultationDueAt ??
    referral.sla?.backReferralDueAt ??
    referral.sla?.followUpDueAt;
  const slaStatus = computeSlaStatus(nextSlaDueAt);
  const activeRescue = referral.rescueActions.find((r) => !r.resolvedAt);

  async function transitionTo(toState: ReferralStateT) {
    setTransitioning(true);
    try {
      const now = new Date().toISOString();
      const transitionRecord = {
        id: uuidv4(),
        referralId: referral.id,
        fromState: referral.currentState,
        toState,
        changedBy,
        changedAt: now,
        deviceLocalTimestamp: now,
        note: note || undefined,
      };
      await writeAndQueue(db.referralTransitions, "referralTransition", transitionRecord);

      const updatedReferral: Referral = {
        ...referral,
        currentState: toState,
        history: [...referral.history, transitionRecord],
        syncStatus: "pending",
      };
      await writeAndQueue(db.referrals, "referral", updatedReferral, "update");
      setNote("");
    } finally {
      setTransitioning(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-lg">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Patient Transfer</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{referral.id.slice(0, 8).toUpperCase()}</p>
      </div>

      {/* Status badges row */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-wrap items-center gap-md shadow-ambient">
        <div
          className={`flex items-center gap-sm px-lg py-sm rounded-full font-label-lg text-label-lg font-bold border ${
            STATE_BADGE_TONE[referral.currentState] ??
            "bg-surface-container text-on-surface-variant border-outline-variant"
          }`}
        >
          <span className="material-symbols-outlined">
            {STATE_ICONS[referral.currentState] ?? "info"}
          </span>
          {STATE_LABELS[referral.currentState]}
        </div>

        {referral.syncStatus === "pending" && (
          <div className="flex items-center gap-1 bg-surface-container text-on-surface-variant px-sm py-xs rounded-full font-label-sm text-label-sm border border-outline-variant">
            <span className="material-symbols-outlined text-[16px]">cloud_off</span>
            not yet synced
          </div>
        )}

        {slaStatus && !terminal && (
          <div
            className={`flex items-center gap-1 px-sm py-xs rounded-full font-label-sm text-label-sm font-bold ${SLA_STATUS_STYLES[slaStatus]}`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {slaStatus === "breached"
              ? "SLA breached"
              : slaStatus === "at_risk"
                ? "SLA at risk"
                : "On track"}
            {nextSlaDueAt && ` — ${formatTimeRemaining(nextSlaDueAt)}`}
          </div>
        )}
      </div>

      {/* Rescue Action banner — Medexa's core differentiator made visible */}
      {activeRescue && (
        <div className="bg-red-accent/10 border border-red-accent/40 rounded-xl p-md flex gap-md items-start shadow-ambient">
          <div className="bg-red-accent text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined filled">emergency</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-red-accent font-bold mb-xs">
              Referral at risk
            </h3>
            <p className="font-body-md text-body-md text-on-surface">Reason: {activeRescue.reason}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Action: {activeRescue.actionTaken.replaceAll("_", " ")}
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-ambient">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Referral Progress</h3>
        <div className="flex flex-col gap-0 relative">
          {[...referral.history].reverse().map((t) => (
            <div key={t.id} className="timeline-item relative flex gap-md pb-lg z-10">
              <div className="timeline-line" />
              <div className="flex-shrink-0 z-10 bg-surface-container-high border-2 border-white rounded-full w-tap-target-min h-tap-target-min flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary">
                  {STATE_ICONS[t.toState] ?? "info"}
                </span>
              </div>
              <div className="flex flex-col justify-center pt-2">
                <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                  {STATE_LABELS[t.toState]}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {new Date(t.changedAt).toLocaleString()}
                </p>
                {t.note && <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{t.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back-referral packet, once recorded */}
      {referral.backReferral && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-ambient">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">assignment_return</span>
            Back-Referral Packet
          </h3>
          <dl className="space-y-sm font-body-md text-body-md">
            <div>
              <dt className="text-on-surface-variant font-label-sm text-label-sm">Outcome</dt>
              <dd className="text-on-surface">{referral.backReferral.outcome}</dd>
            </div>
            {referral.backReferral.treatment && (
              <div>
                <dt className="text-on-surface-variant font-label-sm text-label-sm">Treatment</dt>
                <dd className="text-on-surface">{referral.backReferral.treatment}</dd>
              </div>
            )}
            {referral.backReferral.warningSigns.length > 0 && (
              <div>
                <dt className="text-on-surface-variant font-label-sm text-label-sm">Warning Signs</dt>
                <dd className="text-error">{referral.backReferral.warningSigns.join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Actions */}
      {!terminal && availableTransitions.length > 0 && (
        <div className="space-y-sm">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full h-tap-target-min px-md rounded border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface font-body-md text-body-md"
          />
          <div className="flex flex-col gap-sm">
            {availableTransitions.map((state) => (
              <button
                key={state}
                disabled={transitioning}
                onClick={() => transitionTo(state)}
                className="bg-primary text-on-primary font-label-lg text-label-lg rounded-full h-tap-target-min w-full flex items-center justify-center gap-sm shadow-md hover:translate-y-[-2px] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined">{STATE_ICONS[state] ?? "input"}</span>
                Mark as {STATE_LABELS[state]}
              </button>
            ))}
          </div>
        </div>
      )}

      {terminal && (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-md">
          This referral has reached a terminal state and requires no further action.
        </p>
      )}
    </div>
  );
}
