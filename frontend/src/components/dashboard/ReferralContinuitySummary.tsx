interface ReferralContinuitySummaryProps {
  totalReferrals: number;
  accepted: number;
  completed: number;
  followUpCompleted: number;
  overdue: number;
  noShow: number;
  totalEligibleForCompletion: number;
  followUpsDue: number;
}

/**
 * Implements the exact metrics from Build Guide Section 5:
 *   Referral Completion Rate = Completed / Total Eligible * 100
 *   Follow-up Compliance     = Completed Follow-ups / Follow-ups Due * 100
 * Kept as pure display logic — the underlying numbers come from the
 * backend's aggregation over Referral + AuditLog timestamps, not
 * recomputed ad hoc on the frontend.
 */
export function ReferralContinuitySummary({
  totalReferrals,
  accepted,
  completed,
  followUpCompleted,
  overdue,
  noShow,
  totalEligibleForCompletion,
  followUpsDue,
}: ReferralContinuitySummaryProps) {
  const completionRate =
    totalEligibleForCompletion > 0 ? (completed / totalEligibleForCompletion) * 100 : 0;
  const followUpCompliance = followUpsDue > 0 ? (followUpCompleted / followUpsDue) * 100 : 0;

  return (
    <div className="referral-continuity-summary">
      <h2>Referral Continuity</h2>
      <div className="summary-grid">
        <SummaryCard label="Total Referrals" value={totalReferrals} />
        <SummaryCard label="Accepted" value={accepted} />
        <SummaryCard label="Completed" value={completed} />
        <SummaryCard label="Follow-up Completed" value={followUpCompleted} />
        <SummaryCard label="Overdue" value={overdue} tone="warning" />
        <SummaryCard label="No-show" value={noShow} tone="warning" />
        <SummaryCard
          label="Referral Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          tone={completionRate < 80 ? "warning" : "positive"}
        />
        <SummaryCard
          label="Follow-up Compliance"
          value={`${followUpCompliance.toFixed(1)}%`}
          tone={followUpCompliance < 70 ? "warning" : "positive"}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "warning" | "positive";
}) {
  return (
    <div className={`summary-card summary-card--${tone}`}>
      <span className="summary-card__value">{value}</span>
      <span className="summary-card__label">{label}</span>
    </div>
  );
}
