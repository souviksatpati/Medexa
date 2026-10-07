import { useState } from "react";
import { useLanguageStore } from "@/i18n/useLanguageStore";

interface FacilityMetrics {
  facilityId: string;
  facilityName: string;
  totalReferrals: number;
  completionRatePercent: number;
  avgReferralDelayHours: number;
  followUpCompliancePercent: number;
}

interface FacilityContinuityTableProps {
  facilities: FacilityMetrics[];
  completionRateAlertBelow?: number;
  followUpComplianceAlertBelow?: number;
  delayAlertAboveHours?: number;
}

type SortKey = keyof Omit<FacilityMetrics, "facilityId" | "facilityName"> | "facilityName";

/**
 * Matches the Stitch "Facility Continuity" table screen: sortable
 * column headers, per-row alert styling (tinted background + bold red
 * cell + ALERT pill), progress bars for the compliance column, and a
 * search/filter bar + pagination footer. This is the screen the
 * canonical context calls "a health-system intervention tool, not a
 * reporting page" — a district officer scanning this should see which
 * facilities need a phone call without reading every number.
 */
export function FacilityContinuityTable({
  facilities,
  completionRateAlertBelow = 80,
  followUpComplianceAlertBelow = 70,
  delayAlertAboveHours = 12,
}: FacilityContinuityTableProps) {
  const { tPortal } = useLanguageStore();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("facilityName");
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((asc) => !asc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const filtered = facilities.filter((f) =>
    f.facilityName.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey as keyof FacilityMetrics];
    const bVal = b[sortKey as keyof FacilityMetrics];
    const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="bg-surface-container-lowest rounded border border-outline-variant shadow-sm overflow-hidden flex flex-col">
      <div className="p-lg border-b border-outline-variant flex flex-wrap gap-md justify-between items-center bg-surface">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">business</span>
          {tPortal("facilityContinuity", "Facility Continuity")}
        </h2>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-full font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all w-64"
            placeholder={tPortal("searchFacilities", "Search facilities...")}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto table-scroll">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-lg text-label-lg">
              <SortableHeader label={tPortal("facilityName", "Facility Name")} sortKey="facilityName" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortableHeader label={tPortal("totalReferrals", "Total Referrals")} sortKey="totalReferrals" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortableHeader label={tPortal("completionRate", "Completion Rate")} sortKey="completionRatePercent" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortableHeader label={tPortal("avgReferralDelay", "Avg Referral Delay")} sortKey="avgReferralDelayHours" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <th className="p-md font-semibold">{tPortal("followUpCompliance", "Follow-up Compliance")}</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md bg-surface-container-lowest">
            {sorted.map((f) => {
              const completionAlert = f.completionRatePercent < completionRateAlertBelow;
              const delayAlert = f.avgReferralDelayHours > delayAlertAboveHours;
              const followUpAlert = f.followUpCompliancePercent < followUpComplianceAlertBelow;
              const anyAlert = completionAlert || delayAlert || followUpAlert;

              const dotTone = anyAlert
                ? "bg-error"
                : f.completionRatePercent < 90
                  ? "bg-amber-accent"
                  : "bg-primary";

              return (
                <tr
                  key={f.facilityId}
                  className={`border-b transition-colors ${
                    anyAlert
                      ? "border-error/20 bg-error-container/20 hover:bg-error-container/30"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <td className="p-md font-medium text-on-surface">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${dotTone}`} />
                      {f.facilityName}
                    </div>
                  </td>
                  <td className="p-md text-on-surface-variant">{f.totalReferrals.toLocaleString()}</td>
                  <td className="p-md">
                    <div className="flex items-center gap-2">
                      {completionAlert ? (
                        <>
                          <span className="font-bold text-error">
                            {f.completionRatePercent.toFixed(0)}%
                          </span>
                          <span className="bg-error text-on-error px-2 py-0.5 rounded-full font-label-sm text-label-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            ALERT
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-2 text-primary font-semibold">
                          <span className="material-symbols-outlined text-[18px] filled">check_circle</span>
                          {f.completionRatePercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`p-md ${delayAlert ? "text-error font-medium" : "text-on-surface-variant"}`}>
                    {f.avgReferralDelayHours.toFixed(1)}h
                  </td>
                  <td className="p-md">
                    <div className="w-full bg-surface-container rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${followUpAlert ? "bg-error" : "bg-primary"}`}
                        style={{ width: `${Math.min(f.followUpCompliancePercent, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-label-sm font-label-sm mt-1 block ${followUpAlert ? "text-error" : "text-on-surface-variant"}`}
                    >
                      {f.followUpCompliancePercent.toFixed(0)}% compliant
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-md border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Showing {sorted.length} of {facilities.length} facilities
        </span>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  current,
  asc,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="p-md font-semibold cursor-pointer hover:bg-surface-container transition-colors group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span
          className={`material-symbols-outlined text-[16px] transition-transform ${
            active ? "opacity-100" : "opacity-50 group-hover:opacity-100"
          } ${active && !asc ? "rotate-180" : ""}`}
        >
          arrow_drop_down
        </span>
      </div>
    </th>
  );
}
