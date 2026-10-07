import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { PortalHeader } from "@/components/common/PortalHeader";
import { useReferralAuth } from "@/sync/referralAuth";
import { useReferralStore, type UnifiedReferral } from "@/sync/referralStore";
import { DistrictOfficeAuthModal } from "@/components/referral/DistrictOfficeAuthModal";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { queueBackReferralOfflineFirst, queueReferralTransitionOfflineFirst, referralApi } from "@/api/referralApi";

export function DistrictOfficePage() {
  const { isDistrictOfficerAuthenticated, districtOfficerUser, logoutDistrictOfficer } = useReferralAuth();
  const { referrals, admitDistrictPatient, backReferPatient } = useReferralStore();
  const { tPortal, language } = useLanguageStore();

  const isDistrictOfficer = isDistrictOfficerAuthenticated();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Back-Referral Modal state
  const [backReferModalOpen, setBackReferModalOpen] = useState(false);
  const [selectedCaseForBackRefer, setSelectedCaseForBackRefer] = useState<UnifiedReferral | null>(null);
  const [treatmentSummary, setTreatmentSummary] = useState("");
  const [postDischargeNotes, setPostDischargeNotes] = useState("");
  const [followUpDays, setFollowUpDays] = useState(3);

  useEffect(() => {
    let mounted = true;
    async function loadReferrals() {
      try {
        setIsLoading(true);
        const apiData = await referralApi.listReferrals();
        if (mounted && apiData.length > 0) {
          useReferralStore.getState().loadCustomDataset(apiData);
        }
      } catch (err) {
        console.warn("Could not load backend referrals in DistrictOfficePage:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadReferrals();
    return () => {
      mounted = false;
    };
  }, []);

  // District-relevant cases: escalated, in consultation, or back-referred
  const districtCases = (referrals || []).filter(
    (r) =>
      r.targetLevel === "DISTRICT_OFFICE" ||
      r.status === "Escalated to District" ||
      r.status === "In Consultation" ||
      r.status === "Back-Referred" ||
      r.priority === "Emergency"
  );

  const totalCases = districtCases.length;
  const emergencyCount = districtCases.filter((r) => r.priority === "Emergency" || r.triageLevel === "RED").length;
  const inConsultationCount = districtCases.filter((r) => r.status === "In Consultation").length;
  const backReferredCount = districtCases.filter((r) => r.status === "Back-Referred").length;

  const handleAdmitConsult = async (caseId: string) => {
    try {
      setActionLoadingId(caseId);
      await referralApi.transitionReferral(caseId, "CONSULTED", "Admitted for tertiary consultation");
      admitDistrictPatient(caseId, "Dr. A. Sen (Chief Specialist)", "Specialist Ward 3", "Patient admitted and in specialist consultation.");
    } catch {
      try {
        await queueReferralTransitionOfflineFirst(caseId, "CONSULTED", "Admitted for tertiary consultation");
        admitDistrictPatient(caseId, "Dr. A. Sen (Chief Specialist)", "Specialist Ward 3", "Patient admitted and in specialist consultation.");
      } catch (queueErr) {
        console.error("Consultation transition could not be synchronized or queued:", queueErr);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenBackReferModal = (ref: UnifiedReferral) => {
    setSelectedCaseForBackRefer(ref);
    setTreatmentSummary("Patient stabilized post clinical evaluation.");
    setPostDischargeNotes("Verify daily vitals and monitor medication adherence.");
    setFollowUpDays(3);
    setBackReferModalOpen(true);
  };

  const handleSubmitBackReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForBackRefer) return;

    try {
      setActionLoadingId(selectedCaseForBackRefer.id);
      await referralApi.createBackReferral({
        referralId: selectedCaseForBackRefer.id,
        treatment: treatmentSummary,
        instructions: postDischargeNotes,
        recordedBy: districtOfficerUser?.id || "demo-officer-001",
      });
      await referralApi.transitionReferral(
        selectedCaseForBackRefer.id,
        "REFERRED_BACK",
        `Back-referred to ASHA for ${followUpDays}-day home monitoring`
      );
      backReferPatient(selectedCaseForBackRefer.id, postDischargeNotes, followUpDays);
    } catch {
      try {
        await queueBackReferralOfflineFirst({
          referralId: selectedCaseForBackRefer.id,
          careEpisodeId: selectedCaseForBackRefer.id,
          instructions: postDischargeNotes,
          recordedBy: districtOfficerUser?.id || "demo-officer-001",
        });
        backReferPatient(selectedCaseForBackRefer.id, postDischargeNotes, followUpDays);
      } catch (queueErr) {
        console.error("Back-referral could not be synchronized or queued:", queueErr);
      }
    } finally {
      setBackReferModalOpen(false);
      setSelectedCaseForBackRefer(null);
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="min-h-screen flex-1 md:ml-64 p-4 sm:p-6 md:p-8">
          {/* Dedicated Role-Scoped Portal Header */}
          <PortalHeader
            portalName={tPortal("regionalHospitalReferrals", "Regional Hospital Referrals", language)}
            portalIcon="local_hospital"
            tierBadge={tPortal("districtOfficeCommand", "Regional Hospital Command (Tertiary Tier)", language)}
            themeColor="purple"
            user={districtOfficerUser}
            onLogout={logoutDistrictOfficer}
            onOpenAuth={() => setAuthModalOpen(true)}
            allReferralsPath="/"
          />

          {!isDistrictOfficer ? (
            /* LOCK SCREEN CARD: ZERO CLINICAL DATA VISIBLE */
            <div className="mx-auto max-w-xl py-6 sm:py-10">
              <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-700 mb-4">
                  <span className="material-symbols-outlined text-4xl">lock</span>
                </div>
                <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-700 mb-2">
                  Regional Hospital Command Tier
                </span>
                <h2 className="text-2xl font-bold text-on-surface">
                  Regional Hospital Officer Authentication Required
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant max-w-md mx-auto">
                  Access to tertiary hospital admissions, ICU beds, specialist consultations, and back-referrals requires verified Specialist / CMO credentials.
                </p>

                <div className="mt-6 border-t border-outline-variant pt-6 text-left">
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3.5 px-6 font-bold text-white shadow-md hover:bg-purple-800 active:scale-[0.98] transition"
                  >
                    <span className="material-symbols-outlined">key</span>
                    <span>Login as Regional Hospital Officer</span>
                  </button>

                  <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-2">
                      <span className="material-symbols-outlined text-base text-purple-700">badge</span>
                      <span>Registered Regional Hospital Officers (Registry Database):</span>
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold text-on-surface">Dr. Swapan Banerjee (DHO-WB-101)</p>
                          <p className="text-[11px] text-on-surface-variant">Bankura Regional Hospital • PIN: 9876</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("DHO-WB-101", "9876", "district_officer");
                          }}
                          className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-700 hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold text-on-surface">Dr. Arundhati Ghosh (DHO-WB-102)</p>
                          <p className="text-[11px] text-on-surface-variant">Purulia Regional Hospital • PIN: 9876</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("DHO-WB-102", "9876", "district_officer");
                          }}
                          className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-700 hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <Link
                      to="/#portals"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>Return to Portal Chooser</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED REGIONAL HOSPITAL SUMMARY DASHBOARD */
            <div className="space-y-6">
              {/* Geographic Command Hierarchy Context */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50/50 px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-purple-950 font-medium">
                  <span className="material-symbols-outlined text-base text-purple-700">local_hospital</span>
                  <span><strong>Regional Hospital Tertiary Command:</strong> West Bengal → Bankura Regional Hospital & Specialist Administration</span>
                </div>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-bold text-purple-900">
                  {districtOfficerUser?.facilityOrVillage || "Bankura Regional Hospital"}
                </span>
              </div>

              {/* HIGH-LEVEL STATISTICS SUMMARY (PRESCRIBED COUNTS ONLY) */}
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total: 4 (Escalated from CHC/PHC) */}
                <div className="rounded-3xl border border-purple-200 bg-surface p-6 shadow-xs transition hover:shadow-sm min-h-[160px] flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant break-words">
                        {tPortal("totalDistrictQueue", "Total District Queue")}
                      </p>
                      <h3 className="mt-2 text-4xl font-extrabold text-purple-950">
                        {totalCases}
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-800">
                      <span className="material-symbols-outlined text-2xl">local_hospital</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-purple-800">
                    <span className="material-symbols-outlined text-sm shrink-0">arrow_upward</span>
                    <span className="break-words">{tPortal("escalatedFromChcPhc", "Escalated from CHC/PHC")}</span>
                  </div>
                </div>

                {/* Emergency: 2 */}
                <div className="rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-xs transition hover:shadow-sm min-h-[160px] flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-800 break-words">
                        {tPortal("emergencyRedCases", "Emergency Red Cases")}
                      </p>
                      <h3 className="mt-2 text-4xl font-extrabold text-red-700 animate-pulse">
                        {emergencyCount}
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                      <span className="material-symbols-outlined text-2xl">emergency</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-red-700 break-words">
                    {tPortal("immediateSpecialistRequired", "Immediate specialist attention required")}
                  </p>
                </div>

                {/* In Consultation: 1 */}
                <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6 shadow-xs transition hover:shadow-sm min-h-[160px] flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-800 break-words">
                        {tPortal("admittedInConsult", "In Consultation")}
                      </p>
                      <h3 className="mt-2 text-4xl font-extrabold text-blue-700">
                        {inConsultationCount}
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                      <span className="material-symbols-outlined text-2xl">stethoscope</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-blue-700 break-words">
                    {tPortal("underSpecialistEval", "Under specialist evaluation")}
                  </p>
                </div>

                {/* Back-Referred: 1 */}
                <div className="rounded-3xl border border-teal-200 bg-teal-50/40 p-6 shadow-xs transition hover:shadow-sm min-h-[160px] flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-800 break-words">
                        {tPortal("backReferredToAsha", "Back-Referred to ASHA")}
                      </p>
                      <h3 className="mt-2 text-4xl font-extrabold text-teal-700">
                        {backReferredCount}
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
                      <span className="material-symbols-outlined text-2xl">assignment_return</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-teal-700 break-words">
                    {tPortal("homeFollowUpCoordinated", "Home follow-up coordinated")}
                  </p>
                </div>
              </section>

              {/* REPORT LINK BANNER: PATIENT DOSSIERS & INDIVIDUAL DETAILS */}
              <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-surface to-indigo-50/50 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-900">
                      <span className="material-symbols-outlined text-sm">analytics</span>
                      <span>{tPortal("recordsCentralizedInReports", "Patient Records Centralized in Reports")}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                      {tPortal("detailedChcPatientReferrals", "Detailed CHC/PHC Patient Referrals & Case Logs")}
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {tPortal("regionalGovernanceNotice", "Per regional hospital governance protocols, individual patient-level dossiers, clinical triage notes, diagnostic findings, and continuum tracking are accessible under the Reports & Analytics portal.")}
                    </p>
                  </div>

                  <Link
                    to="/dashboard/reports"
                    className="inline-flex items-center gap-2 rounded-2xl bg-purple-700 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-purple-800 active:scale-[0.98] transition shrink-0"
                  >
                    <span className="material-symbols-outlined">folder_shared</span>
                    <span>{tPortal("viewPatientDetailsInReports", "View Patient Details in Reports")}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </section>

              {/* OPERATIONAL DISTRICT REFERRAL QUEUE & ACTIONS */}
              <section className="rounded-3xl border border-purple-200 bg-surface p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-700">emergency_heat</span>
                      <span>District Inpatient & Escalation Queue</span>
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Authoritative patient cases requiring tertiary hospital admission, specialist evaluation, or back-referral.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoading && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-semibold animate-pulse">
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        <span>Syncing...</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full">
                      {districtCases.length} Active Cases
                    </span>
                  </div>
                </div>

                {districtCases.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-outline-variant rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-slate-400">check_circle</span>
                    <p className="mt-2 text-sm font-semibold text-on-surface-variant">No active escalated cases in district queue</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                          <th className="py-3 px-3">Patient</th>
                          <th className="py-3 px-3">Referring Origin</th>
                          <th className="py-3 px-3">Category / Symptoms</th>
                          <th className="py-3 px-3">Triage / Priority</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/40">
                        {districtCases.map((c) => (
                          <tr key={c.id} className="hover:bg-purple-50/30 transition">
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-on-surface">{c.patientName}</div>
                              <div className="text-[11px] text-on-surface-variant">{c.patientId} • {c.ageGender}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="font-medium text-on-surface">{c.fromFacilityOrWorker}</div>
                              <div className="text-[11px] text-on-surface-variant">{c.village}, {c.block}</div>
                            </td>
                            <td className="py-3.5 px-3 max-w-xs">
                              <div className="font-semibold text-on-surface truncate">{c.category}</div>
                              <div className="text-[11px] text-on-surface-variant line-clamp-1">{c.clinicalNotes}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  c.triageLevel === "RED"
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : c.triageLevel === "YELLOW"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {c.priority}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="inline-flex rounded-full bg-purple-100 text-purple-900 px-2.5 py-0.5 text-[10px] font-bold">
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              {c.status !== "In Consultation" && c.status !== "Back-Referred" && c.status !== "Completed" ? (
                                <button
                                  type="button"
                                  disabled={actionLoadingId === c.id}
                                  onClick={() => handleAdmitConsult(c.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-purple-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-800 disabled:opacity-50 transition"
                                >
                                  <span className="material-symbols-outlined text-xs">how_to_reg</span>
                                  <span>Admit & Consult</span>
                                </button>
                              ) : c.status === "In Consultation" ? (
                                <button
                                  type="button"
                                  disabled={actionLoadingId === c.id}
                                  onClick={() => handleOpenBackReferModal(c)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 disabled:opacity-50 transition"
                                >
                                  <span className="material-symbols-outlined text-xs">assignment_return</span>
                                  <span>Back-Refer</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                                  Back-Referred to ASHA
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* TERTIARY COMMAND CAPACITY OVERVIEW */}
              <section className="grid gap-5 md:grid-cols-3">
                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-xs min-h-[220px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                        <span className="material-symbols-outlined">bed</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">{tPortal("icuEmergencyBeds", "ICU & Emergency Beds")}</h4>
                        <p className="text-xs text-on-surface-variant">{tPortal("criticalCareWing", "Regional Critical Care Wing")}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">{tPortal("totalCriticalBeds", "Total Critical Beds")}:</span>
                        <span className="font-bold text-on-surface">24 Beds</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">{tPortal("occupiedByEscalations", "Occupied by Escalations")}:</span>
                        <span className="font-bold text-red-700">18 Beds (75%)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-on-surface-variant">{tPortal("availableForEmergency", "Available for Emergency")}:</span>
                        <span className="font-bold text-emerald-700">6 Beds</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-xs min-h-[220px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
                        <span className="material-symbols-outlined">stethoscope</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">{tPortal("specialistRoster", "Specialist Roster")}</h4>
                        <p className="text-xs text-on-surface-variant">{tPortal("activeOnCallRoster", "Active On-Call Roster")}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">Chief Cardiologist:</span>
                        <span className="font-bold text-on-surface">Dr. A. Sen (On Duty)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">General Surgeon:</span>
                        <span className="font-bold text-on-surface">Dr. S. Chatterjee</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-on-surface-variant">Pulmonologist:</span>
                        <span className="font-bold text-on-surface">Dr. R. N. Mukherjee</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-xs min-h-[220px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                        <span className="material-symbols-outlined">ambulance</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">{tPortal("transportCoordination", "108 Transport Coordination")}</h4>
                        <p className="text-xs text-on-surface-variant">{tPortal("frontlineTransferPathway", "Frontline Transfer Pathway")}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">{tPortal("alsAmbulancesReady", "108 ALS Ambulances")}:</span>
                        <span className="font-bold text-emerald-700">4 Ready for Dispatch</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">{tPortal("transitEnRoute", "Transit En Route from CHC")}:</span>
                        <span className="font-bold text-purple-900">1 In Transit</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-on-surface-variant">{tPortal("avgTransferTime", "Average Transfer Time")}:</span>
                        <span className="font-bold text-on-surface">38 Minutes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Back-Referral Modal */}
      {backReferModalOpen && selectedCaseForBackRefer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl border border-outline-variant">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Coordinate Back-Referral</h3>
                <p className="text-xs text-on-surface-variant">
                  Discharge patient {selectedCaseForBackRefer.patientName} back to frontline ASHA supervision.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBackReferModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitBackReferral} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Treatment Summary</label>
                <input
                  type="text"
                  required
                  value={treatmentSummary}
                  onChange={(e) => setTreatmentSummary(e.target.value)}
                  placeholder="e.g. Patient stabilized; specialist consultation completed"
                  className="w-full rounded-xl border border-outline-variant p-2.5 font-medium outline-none focus:border-purple-700"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">ASHA Home Monitoring Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={postDischargeNotes}
                  onChange={(e) => setPostDischargeNotes(e.target.value)}
                  placeholder="Instructions for frontline worker (e.g. daily vitals, medication compliance)"
                  className="w-full rounded-xl border border-outline-variant p-2.5 font-medium outline-none focus:border-purple-700"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Follow-up Due Within (Days)</label>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-outline-variant p-2.5 font-medium outline-none focus:border-purple-700"
                >
                  <option value={2}>2 Days (Critical Monitoring)</option>
                  <option value={3}>3 Days (Standard Protocol)</option>
                  <option value={5}>5 Days (Low Risk Extended)</option>
                  <option value={7}>7 Days (Weekly Review)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setBackReferModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="rounded-xl bg-teal-700 px-5 py-2 font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                >
                  Confirm Back-Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Regional Hospital Medical Officer Auth Modal */}
      <DistrictOfficeAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
