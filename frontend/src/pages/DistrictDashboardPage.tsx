import { useMemo, useState, useEffect } from "react";

import { ContinuityOverview } from "@/components/dashboard/ContinuityOverview";
import { FacilityContinuityTable } from "@/components/dashboard/FacilityContinuityTable";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useReferralAuth } from "@/sync/referralAuth";
import { ReferralCharts } from "@/components/dashboard/ReferralCharts";
import { FacilityScorecardModal, type FacilityScorecardData } from "@/components/common/FacilityScorecardModal";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { referralApi, type DashboardResponse } from "@/api/referralApi";

const STATE_OPTIONS = ["West Bengal"];
const DISTRICT_MAP: Record<string, string[]> = {
  "West Bengal": ["24 PARAGANAS SOUTH"],
};
const BLOCK_MAP: Record<string, string[]> = {
  "24 PARAGANAS SOUTH": ["All Blocks", "Namkhana Block", "Patharpratima Block", "Diamond Harbour Block"],
};

export function DistrictDashboardPage() {
  const { districtOfficerUser } = useReferralAuth();
  const { tPortal, language } = useLanguageStore();

  // Cascading Geographic Filter (§5.4)
  const [selectedState, setSelectedState] = useState("West Bengal");
  const [selectedDistrict, setSelectedDistrict] = useState("24 PARAGANAS SOUTH");
  const [selectedBlock, setSelectedBlock] = useState("All Blocks");
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      try {
        const dashResult = await referralApi.getDashboard({ district: selectedDistrict, block: selectedBlock });
        if (mounted) setDashboardData(dashResult);
      } catch (err) {
        console.warn("Could not fetch backend dashboard data:", err);
      }
    }
    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [selectedDistrict, selectedBlock]);

  const districtHospitalScorecard: FacilityScorecardData = {
    facilityId: "FAC-WB-DH-01",
    facilityName: `${selectedDistrict} Medical College & Regional Hospital`,
    tier: "Regional Hospital",
    block: "Regional Sadar",
    district: selectedDistrict,
    totalBeds: 450,
    occupiedBeds: 394,
    icuBeds: 24,
    icuOccupied: 19,
    ventilatorsAvailable: 5,
    doctorCount: 68,
    nurseCount: 142,
    ambulanceStationed: 6,
    bloodBankStock: "Adequate",
    oxygenSupplyPercent: 98,
    essentialDrugsAvailabilityPercent: 94,
    nqasScorePercent: 91,
    medicalSuperintendent: "Dr. B. K. Majumdar (MSVP)",
    phone: "+91 3242 250102",
  };

  const districtsForState = DISTRICT_MAP[selectedState] || [];
  const blocksForDistrict = BLOCK_MAP[selectedDistrict] || ["All Blocks"];


  // Compute metrics from backend if available, otherwise from reactive store
  const totalReferrals = dashboardData?.total_referrals ?? 0;
  const completed = dashboardData?.completed ?? 0;
  const accepted = dashboardData?.accepted ?? 0;
  const followUpCompleted = dashboardData?.follow_up_completed ?? 0;
  const overdue = dashboardData?.overdue ?? 0;
  const noShow = dashboardData?.no_show ?? 0;
  const totalEligible = dashboardData?.total_eligible_for_completion ?? 0;
  const followUpsDue = dashboardData?.follow_ups_due ?? 0;

  const facilities = useMemo(() => {
    return (dashboardData?.facilities || []).map((f) => ({
      facilityId: f.facility_id,
      facilityName: f.facility_name,
      totalReferrals: f.total_referrals,
      completionRatePercent: f.completion_rate_percent,
      avgReferralDelayHours: f.avg_referral_delay_hours,
      followUpCompliancePercent: f.follow_up_compliance_percent,
    }));
  }, [dashboardData]);

  return (
    <div className="min-h-screen bg-surface">

      {/* Shared Dashboard Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="min-h-screen md:ml-64">

        <div className="p-6 md:p-10 lg:p-12">

          {/* Header */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
                <span className="material-symbols-outlined text-base">domain</span>
                <span>District Command & Tertiary Care</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
                {tPortal("overview", "Continuity Overview", language)}
              </h1>

              <p className="mt-1 text-sm text-on-surface-variant">
                {tPortal("districtOfficeCommand", "District-wide referral performance, clinical transitions, and cross-tier care continuity.", language)}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface-variant border border-outline-variant">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Officer: {districtOfficerUser ? districtOfficerUser.name : "Dr. B. K. Majumdar (CMOH)"}</span>
            </div>
          </header>

          {/* CASCADING GEOGRAPHIC JURISDICTION FILTER BAR (§5.4) */}
          <section className="mb-8 rounded-3xl border border-outline-variant bg-surface p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">filter_alt</span>
                <span>Cascading Jurisdiction Filter (State → District → Block)</span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Showing data for: <strong>{selectedState} → {selectedDistrict} → {selectedBlock}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  1. State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const nextState = e.target.value;
                    setSelectedState(nextState);
                    const dList = DISTRICT_MAP[nextState] || ["Bankura"];
                    setSelectedDistrict(dList[0]);
                    setSelectedBlock("All Blocks");
                  }}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                >
                  {STATE_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  2. District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    const nextDst = e.target.value;
                    setSelectedDistrict(nextDst);
                    setSelectedBlock("All Blocks");
                  }}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                >
                  {districtsForState.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  3. Block Jurisdiction
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                >
                  {blocksForDistrict.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Dashboard Content */}
          <div className="space-y-8">
            <ContinuityOverview
              totalReferrals={totalReferrals}
              accepted={accepted}
              completed={completed}
              followUpCompleted={followUpCompleted}
              overdue={overdue}
              noShow={noShow}
              totalEligibleForCompletion={totalEligible}
              followUpsDue={followUpsDue}
            />

            {/* Task 7: Pure CSS/SVG Referral Trends & Severity Donut */}
            <ReferralCharts
              districtName={selectedDistrict}
              totalReferrals={totalReferrals}
            />

            {/* Facility Table Header with Scorecard Quick Inspection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Health Facility Quality & Capacity</h3>
                <p className="text-xs text-on-surface-variant">
                  Monitors bed occupancy, ICU capacity, and frontline referral compliance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScorecardOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-600 transition"
              >
                <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                <span>Inspect District Hospital Scorecard</span>
              </button>
            </div>

            <FacilityContinuityTable
              facilities={facilities}
            />
          </div>

        </div>

      </main>

      {/* Task 7: Facility Capacity & Quality Scorecard Modal */}
      <FacilityScorecardModal
        facility={districtHospitalScorecard}
        isOpen={scorecardOpen}
        onClose={() => setScorecardOpen(false)}
      />

    </div>
  );
}