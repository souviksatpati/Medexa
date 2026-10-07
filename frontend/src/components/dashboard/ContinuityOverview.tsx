import { useLanguageStore } from "@/i18n/useLanguageStore";

interface ContinuityOverviewProps {
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
 * Matches the Stitch "Continuity Overview" bento-grid screen: four plain
 * metric cards, two alert-accent cards (colored left border), and two
 * "performance" cards with an inline progress bar. Formulas are exactly
 * Build Guide Section 5 / canonical context Section 31:
 *   Referral Completion Rate = Completed / Total Eligible * 100
 *   Follow-up Compliance     = Completed Follow-ups / Follow-ups Due * 100
 */
export function ContinuityOverview({
  totalReferrals,
  accepted,
  completed,
  followUpCompleted,
  overdue,
  noShow,
  totalEligibleForCompletion,
  followUpsDue,
}: ContinuityOverviewProps) {
  const { tPortal } = useLanguageStore();

  const completionRate =
    totalEligibleForCompletion > 0 ? (completed / totalEligibleForCompletion) * 100 : 0;
  const followUpCompliance = followUpsDue > 0 ? (followUpCompleted / followUpsDue) * 100 : 0;

  const completionTone = completionRate >= 85 ? "green-accent" : "amber-accent";
  const complianceTone = followUpCompliance >= 85 ? "green-accent" : "amber-accent";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
      <MetricCard label={tPortal("totalPatientReferrals", "Total Patient Referrals")} value={totalReferrals.toLocaleString()} icon="sync_alt" />
      <MetricCard label={tPortal("accepted", "Accepted")} value={accepted.toLocaleString()} icon="thumb_up" />
      <MetricCard label={tPortal("completed", "Completed")} value={completed.toLocaleString()} icon="check_circle" />
      <MetricCard
        label={tPortal("followUpCompleted", "Follow-up Completed")}
        value={followUpCompleted.toLocaleString()}
        icon="assignment_turned_in"
      />

      <AlertMetricCard label={tPortal("overdue", "Overdue")} value={overdue} icon="warning" tone="amber-accent" />
      <AlertMetricCard label={tPortal("noShow", "No-show")} value={noShow} icon="error" tone="red-accent" />

      <PerformanceCard
        label={tPortal("referralCompletionRate", "Referral Completion Rate")}
        percent={completionRate}
        icon={completionTone === "green-accent" ? "trending_up" : "trending_flat"}
        tone={completionTone}
      />
      <PerformanceCard
        label={tPortal("followUpCompliance", "Follow-up Compliance")}
        percent={followUpCompliance}
        icon={complianceTone === "green-accent" ? "trending_up" : "trending_flat"}
        tone={complianceTone}
      />
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-card p-5 shadow-ambient flex flex-col justify-between hover:shadow-elevated transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="font-label-lg text-label-lg text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-outline">{icon}</span>
      </div>
      <span className="font-display-lg text-display-lg text-primary">{value}</span>
    </div>
  );
}

function AlertMetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: string;
  tone: "amber-accent" | "red-accent";
}) {
  // Tailwind's JIT compiler can't detect dynamically-built class strings
  // like `bg-${tone}` — it needs the full class name present verbatim
  // somewhere in the source. Explicit maps keep every class statically
  // scannable while still letting callers pass a `tone` prop.
  const toneClasses = {
    "amber-accent": {
      border: "bg-amber-accent",
      icon: "text-amber-accent",
      value: "text-amber-accent",
    },
    "red-accent": {
      border: "bg-red-accent",
      icon: "text-red-accent",
      value: "text-red-accent",
    },
  } as const;
  const c = toneClasses[tone];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-card p-5 shadow-ambient flex flex-col justify-between relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${c.border}`} />
      <div className="flex justify-between items-start mb-4 pl-2">
        <span className="font-label-lg text-label-lg text-on-surface-variant">{label}</span>
        <span className={`material-symbols-outlined ${c.icon}`}>{icon}</span>
      </div>
      <span className={`font-display-lg text-display-lg pl-2 ${c.value}`}>{value}</span>
    </div>
  );
}

function PerformanceCard({
  label,
  percent,
  icon,
  tone,
}: {
  label: string;
  percent: number;
  icon: string;
  tone: "amber-accent" | "green-accent";
}) {
  const toneClasses = {
    "amber-accent": {
      border: "border-amber-accent/30",
      icon: "text-amber-accent",
      value: "text-amber-accent",
      bar: "bg-amber-accent",
    },
    "green-accent": {
      border: "border-green-accent/30",
      icon: "text-green-accent",
      value: "text-green-accent",
      bar: "bg-green-accent",
    },
  } as const;
  const c = toneClasses[tone];

  return (
    <div className={`bg-surface-container-lowest border-2 rounded-card p-5 shadow-ambient flex flex-col justify-between ${c.border}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="font-label-lg text-label-lg text-on-surface-variant">{label}</span>
        <span className={`material-symbols-outlined ${c.icon}`}>{icon}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`font-display-lg text-display-lg ${c.value}`}>{percent.toFixed(0)}%</span>
        <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
