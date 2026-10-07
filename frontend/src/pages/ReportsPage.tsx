import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useReferralStore, type UnifiedReferral } from "@/sync/referralStore";
import { ReferralStatusStepper } from "@/components/common/ReferralStatusStepper";
import { PatientRecordDrawer } from "@/components/common/PatientRecordDrawer";
import { mapUnifiedToPatientCase, type PatientCase } from "@/sync/mockPatientCases";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { referralApi, type DashboardResponse } from "@/api/referralApi";

type FacilityReport = {
  name: string;
  referrals: number;
  completed: number;
  pending: number;
};

const facilityReports: FacilityReport[] = [
  {
    name: "Bankura Regional Hospital",
    referrals: 56,
    completed: 42,
    pending: 8,
  },
  {
    name: "CHC Bishnupur",
    referrals: 31,
    completed: 19,
    pending: 7,
  },
  {
    name: "CHC Joypur",
    referrals: 27,
    completed: 18,
    pending: 5,
  },
  {
    name: "Belur CHC / PHC",
    referrals: 24,
    completed: 17,
    pending: 4,
  },
  {
    name: "Sonamukhi Rural Hospital (CHC)",
    referrals: 18,
    completed: 13,
    pending: 3,
  },
];

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-on-surface-variant">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-on-surface">
        {value}
      </p>

      <p className="mt-1 text-xs text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

export function ReportsPage() {
  const { referrals } = useReferralStore();
  const { tPortal, language } = useLanguageStore();

  const [search, setSearch] = useState("");
  const [triageFilter, setTriageFilter] = useState("All");
  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false);
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState<PatientCase | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadReportsData() {
      try {
        const [dashResult, refsResult] = await Promise.allSettled([
          referralApi.getDashboard(),
          referralApi.listReferrals(),
        ]);

        if (mounted) {
          if (dashResult.status === "fulfilled" && dashResult.value) {
            setDashboardData(dashResult.value);
          }
          if (refsResult.status === "fulfilled" && refsResult.value?.length > 0) {
            useReferralStore.getState().loadCustomDataset(refsResult.value);
          }
        }
      } catch (err) {
        console.warn("Could not load backend reports data:", err);
      }
    }
    loadReportsData();
    return () => {
      mounted = false;
    };
  }, []);

  const activeFacilityReports = useMemo(() => {
    if (dashboardData?.facilities && dashboardData.facilities.length > 0) {
      return dashboardData.facilities.map((f) => ({
        name: f.facility_name,
        referrals: f.total_referrals,
        completed: Math.round(f.total_referrals * (f.completion_rate_percent / 100)),
        pending: Math.max(0, f.total_referrals - Math.round(f.total_referrals * (f.completion_rate_percent / 100))),
      }));
    }
    return facilityReports;
  }, [dashboardData]);

  // Filter for CHC/PHC escalated referrals to Regional Hospital with full patient-level details
  const escalatedReferrals = useMemo(() => {
    const list = Array.isArray(referrals) ? referrals : [];
    return list.filter(
      (r) =>
        r &&
        (r.targetLevel === "DISTRICT_OFFICE" ||
          r.status === "Escalated to District" ||
          r.status === "In Consultation" ||
          r.status === "Back-Referred" ||
          r.toFacility.toLowerCase().includes("district") ||
          r.toFacility.toLowerCase().includes("regional"))
    );
  }, [referrals]);

  const filteredEscalated = useMemo(() => {
    const q = search.toLowerCase().trim();
    return escalatedReferrals.filter((item) => {
      if (!item) return false;
      const matchesSearch =
        !q ||
        item.patientName.toLowerCase().includes(q) ||
        item.patientId.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.fromFacilityOrWorker.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q);

      const matchesTriage = triageFilter === "All" || item.triageLevel === triageFilter;
      return matchesSearch && matchesTriage;
    });
  }, [escalatedReferrals, search, triageFilter]);

  const handleOpenRecordForReferral = (item: UnifiedReferral) => {
    setSelectedPatientForRecord(mapUnifiedToPatientCase(item));
    setRecordDrawerOpen(true);
  };

  const totalReferrals = 338;
  const completedReferrals = 244;
  const pendingReferrals = 48;
  const overdueReferrals = 17;

  const completionRate = Math.round(
    (completedReferrals / totalReferrals) * 100,
  );

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        {/* Main */}
        <main className="min-w-0 flex-1 md:ml-64">
          {/* Header */}
          <header className="border-b border-outline-variant bg-surface">
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
                  <Link
                    to="/dashboard/referrals/district-office"
                    className="hover:text-primary font-semibold"
                  >
                    {tPortal("regionalHospitalReferrals", "Regional Hospital Referrals")}
                  </Link>
                  <span>/</span>
                  <span>{tPortal("reports", "Reports & Patient Dossiers")}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {tPortal("reports", "Reports & Analytics", language)}
                </h1>

                <p className="mt-1 text-sm text-on-surface-variant">
                  {tPortal("reportsSubtitle", "Comprehensive patient-level dossiers for CHC/PHC escalated cases, longitudinal records, and health system continuity metrics.")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  defaultValue="Last 6 Months"
                  className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option>{tPortal("last30Days", "Last 30 Days")}</option>
                  <option>{tPortal("last3Months", "Last 3 Months")}</option>
                  <option>{tPortal("last6Months", "Last 6 Months")}</option>
                  <option>{tPortal("thisYear", "This Year")}</option>
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>{tPortal("exportReport", "Export Report")}</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
            {/* ==============================================================
                PRIMARY SECTION: PATIENT-LEVEL CHC/PHC ESCALATED REFERRALS
                (Moved from Regional Hospital summary page per requirement)
            ============================================================== */}
            <section className="rounded-3xl border border-purple-200 bg-surface p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-outline-variant">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                      <span className="material-symbols-outlined text-lg">folder_shared</span>
                    </span>
                    <h2 className="text-lg font-bold text-on-surface">
                      {tPortal("patientDossiersTitle", "CHC/PHC Escalated Referrals — Detailed Patient Dossiers")}
                    </h2>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {tPortal("patientDossiersSubtitle", "Individual patient records, triage urgency, assigned specialists, and longitudinal timelines escalated from Community Health Centres.")}
                  </p>
                </div>

                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900 self-start md:self-auto">
                  {filteredEscalated.length} {tPortal("patientsActiveInContinuum", "Patients Active in Continuum")}
                </span>
              </div>

              {/* Filters for Patient Dossiers */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tPortal("searchDossiersPlaceholder", "Search by patient name, ID, village, or clinical condition...")}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-9 py-2 text-xs outline-none focus:border-purple-600 font-medium"
                  />
                </div>

                <select
                  value={triageFilter}
                  onChange={(e) => setTriageFilter(e.target.value)}
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600"
                >
                  <option value="All">{tPortal("allTriageLevels", "All Triage Levels")}</option>
                  <option value="RED">{tPortal("emergencyRedCases", "Emergency Red Cases")}</option>
                  <option value="YELLOW">{tPortal("yellowHigh", "High / Urgent Yellow Cases")}</option>
                  <option value="GREEN">{tPortal("greenRoutine", "Normal / Green Cases")}</option>
                </select>
              </div>

              {/* Patient Level Details Table */}
              <div className="mt-5 overflow-x-auto rounded-2xl border border-outline-variant">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase font-bold text-on-surface-variant">
                    <tr>
                      <th className="px-5 py-3.5">{tPortal("patientAndIdentity", "Patient & Identity")}</th>
                      <th className="px-5 py-3.5">{tPortal("pathwayChcToRegional", "Pathway (From CHC → Regional)")}</th>
                      <th className="px-5 py-3.5">{tPortal("triageStatus", "Triage Status")}</th>
                      <th className="px-5 py-3.5">{tPortal("assignedSpecialist", "Assigned Specialist")}</th>
                      <th className="px-5 py-3.5">{tPortal("continuumStage", "Continuum Stage")}</th>
                      <th className="px-5 py-3.5 text-right">{tPortal("dossierActions", "Dossier Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-xs">
                    {filteredEscalated.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/60 transition">
                        {/* Patient & Identity */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-sm text-on-surface">{item.patientName}</p>
                          <p className="text-on-surface-variant">
                            {item.patientId} • {item.ageGender}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] font-semibold text-purple-700">
                            {item.id}
                          </p>
                          <p className="mt-1 text-[11px] text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                            {item.village}, {item.block} ({item.district})
                          </p>
                        </td>

                        {/* Pathway */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                              From: <strong className="text-on-surface">{item.fromFacilityOrWorker}</strong>
                            </span>
                            <span className="text-purple-800 flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                              To: <strong className="text-purple-950">{item.toFacility}</strong>
                            </span>
                          </div>
                          <p className="mt-1 font-semibold text-primary line-clamp-1 max-w-[220px]">
                            {item.category}
                          </p>
                          <p className="mt-0.5 line-clamp-2 max-w-[220px] text-on-surface-variant text-[11px]" title={item.clinicalNotes}>
                            {item.clinicalNotes}
                          </p>
                        </td>

                        {/* Triage Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              item.triageLevel === "RED"
                                ? "bg-red-100 text-red-800 animate-pulse border border-red-200"
                                : item.triageLevel === "YELLOW"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            Triage {item.triageLevel}
                          </span>
                          <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">
                            {item.priority} Urgency
                          </p>
                        </td>

                        {/* Assigned Specialist */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-on-surface">
                            {item.assignedDoctor || "Regional Duty Specialist"}
                          </p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            Transport: {item.escortTransport}
                          </p>
                        </td>

                        {/* Continuum Stage Stepper */}
                        <td className="px-5 py-4">
                          <ReferralStatusStepper currentStage={item.status} isCompact />
                          <p className="mt-1 text-[11px] text-on-surface-variant line-clamp-1 max-w-[190px]">
                            {item.lastAction}
                          </p>
                        </td>

                        {/* Dossier Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenRecordForReferral(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                              title="View Longitudinal Health Record"
                            >
                              <span className="material-symbols-outlined text-[15px] text-purple-700">history_edu</span>
                              <span>Record</span>
                            </button>

                            <Link
                              to={`/dashboard/referrals/${item.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-800"
                            >
                              <span>Manage</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Summary cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Referrals"
                value={String(totalReferrals)}
                description="Across all regional facilities"
              />

              <StatCard
                title="Completed"
                value={String(completedReferrals)}
                description="Successfully completed"
              />

              <StatCard
                title="Pending"
                value={String(pendingReferrals)}
                description="Awaiting action"
              />

              <StatCard
                title="Overdue"
                value={String(overdueReferrals)}
                description="Require attention"
              />
            </section>

            {/* Completion rate + status */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Completion rate */}
              <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Referral Completion
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Overall referral completion rate across regional health network.
                </p>

                <div className="mt-8 flex items-center justify-center">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-gray-200">
                    <div
                      className="absolute inset-[-18px] rounded-full border-[18px] border-primary"
                      style={{
                        clipPath: `polygon(0 0, 100% 0, 100% ${completionRate}%, 0 ${completionRate}%)`,
                      }}
                    />

                    <div className="text-center">
                      <p className="text-4xl font-bold">
                        {completionRate}%
                      </p>

                      <p className="mt-1 text-xs text-on-surface-variant">
                        Completion rate
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Completed
                  </span>

                  <span className="font-semibold">
                    {completedReferrals} referrals
                  </span>
                </div>
              </div>

              {/* Status distribution */}
              <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-bold">
                  Referral Status Breakdown
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Current distribution of referrals across care stages.
                </p>

                <div className="mt-8 space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span>Completed ({completedReferrals})</span>
                      <span>{Math.round((completedReferrals / totalReferrals) * 100)}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-surface-container overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(completedReferrals / totalReferrals) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span>Pending Verification ({pendingReferrals})</span>
                      <span>{Math.round((pendingReferrals / totalReferrals) * 100)}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-surface-container overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(pendingReferrals / totalReferrals) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span>Overdue Escalations ({overdueReferrals})</span>
                      <span>{Math.round((overdueReferrals / totalReferrals) * 100)}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-surface-container overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(overdueReferrals / totalReferrals) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Facility performance breakdown */}
            <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-bold">Facility Referral Performance</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Breakdown of incoming and completed referrals by facility tier.</p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-outline-variant text-xs uppercase font-bold text-on-surface-variant">
                    <tr>
                      <th className="py-3 px-4">Facility Name</th>
                      <th className="py-3 px-4">Total Referrals</th>
                      <th className="py-3 px-4">Completed</th>
                      <th className="py-3 px-4">Pending</th>
                      <th className="py-3 px-4">Performance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {activeFacilityReports.map((f) => {
                      const rate = Math.round((f.completed / f.referrals) * 100);
                      return (
                        <tr key={f.name} className="hover:bg-surface-container-low transition">
                          <td className="py-3 px-4 font-bold">{f.name}</td>
                          <td className="py-3 px-4">{f.referrals}</td>
                          <td className="py-3 px-4 text-emerald-700 font-semibold">{f.completed}</td>
                          <td className="py-3 px-4 text-amber-700 font-semibold">{f.pending}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 bg-surface-container rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-xs font-bold">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Longitudinal Patient Record Drawer for Patient Dossiers */}
      <PatientRecordDrawer
        patient={selectedPatientForRecord}
        isOpen={recordDrawerOpen}
        onClose={() => setRecordDrawerOpen(false)}
      />
    </div>
  );
}