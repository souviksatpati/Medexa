import type { ClinicalRiskLevelT, ContinuityRiskLevelT } from "@/models/careEpisode";

/**
 * MEDEXA_CANONICAL_PROJECT_CONTEXT.md Section 16 is a hard rule: clinical
 * risk and continuity risk must never share a badge component or visual
 * treatment. ClinicalRiskBadge uses the error-container Material tokens
 * (matches the Stitch Triage Form's "HIGH RISK" banner exactly).
 * ContinuityRiskBadge deliberately uses the separate amber/red-accent
 * tokens reserved for continuity/SLA status on the dashboard screens,
 * and always renders as a pill with an icon, never a solid banner — a
 * different SHAPE, not just a different color, so the two concepts are
 * unmistakable even at a glance or in a screenshot.
 */

const CLINICAL_STYLES: Record<ClinicalRiskLevelT, string> = {
  low: "bg-green-accent/10 text-green-accent border-green-accent/30",
  moderate: "bg-amber-accent/10 text-amber-accent border-amber-accent/30",
  high: "bg-tertiary-container/20 text-tertiary border-tertiary/30",
  emergency: "bg-error-container text-on-error-container border-error",
};

export function ClinicalRiskBadge({ level }: { level: ClinicalRiskLevelT }) {
  return (
    <span
      className={`inline-flex items-center gap-xs px-sm py-[4px] rounded-full border font-label-sm text-label-sm font-bold uppercase ${CLINICAL_STYLES[level]}`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {level === "emergency" ? "emergency" : "medical_information"}
      </span>
      {level} clinical risk
    </span>
  );
}

const CONTINUITY_STYLES: Record<ContinuityRiskLevelT, string> = {
  low: "bg-surface-container text-on-surface-variant border-outline-variant",
  medium: "bg-amber-accent/10 text-amber-accent border-amber-accent/40",
  high: "bg-red-accent/10 text-red-accent border-red-accent/40",
};

export function ContinuityRiskBadge({ level }: { level: ContinuityRiskLevelT }) {
  return (
    <span
      className={`inline-flex items-center gap-xs px-sm py-[4px] rounded-full border font-label-sm text-label-sm font-bold uppercase ${CONTINUITY_STYLES[level]}`}
    >
      <span className="material-symbols-outlined text-[16px]">sync_alt</span>
      {level} continuity risk
    </span>
  );
}
