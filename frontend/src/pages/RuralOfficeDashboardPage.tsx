import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { PortalHeader } from "@/components/common/PortalHeader";
import { useReferralAuth } from "@/sync/referralAuth";
import { useReferralStore, useScopedReferrals, type UnifiedReferral } from "@/sync/referralStore";
import { ensurePatientAndEpisode, queueReferralOfflineFirst, queueReferralTransitionOfflineFirst, referralApi } from "@/api/referralApi";
import { BlockOfficeAuthModal } from "@/components/referral/BlockOfficeAuthModal";
import { ReferralStatusStepper } from "@/components/common/ReferralStatusStepper";
import { PatientRecordDrawer } from "@/components/common/PatientRecordDrawer";
import { mapUnifiedToPatientCase, type PatientCase } from "@/sync/mockPatientCases";
import { GeoCascadeSelect, type GeoValue } from "@/components/common/GeoCascadeSelect";
import { useLanguageStore } from "@/i18n/useLanguageStore";

const FACILITY_FILTER_OPTIONS = [
  "All Facilities",
  "Belur CHC",
  "Joypur CHC",
  "Sonamukhi CHC",
  "Regional Hospital",
];

const TRIAGE_FILTER_OPTIONS = ["All Triage Levels", "RED", "YELLOW", "GREEN"];

const STATUS_FILTER_OPTIONS = [
  "All Statuses",
  "At CHC/PHC",
  "Referred to CHC/PHC",
  "Escalated to Regional Hospital",
  "In Consultation",
  "Discharged / Returned to ASHA",
  "Episode Closed",
];

const safeStr = (val: unknown): string => {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  return String(val);
};

export function RuralOfficeDashboardPage() {
  const [searchParams] = useSearchParams();
  const { isBlockOfficerAuthenticated, blockOfficerUser, logoutBlockOfficer } = useReferralAuth();
  const { addBlockReferral, escalateToDistrict } = useReferralStore();
  const scopedReferrals = useScopedReferrals();
  const { tPortal, language } = useLanguageStore();

  const isOfficer = isBlockOfficerAuthenticated();
  const list = useMemo(
    () => (Array.isArray(scopedReferrals) ? scopedReferrals : []),
    [scopedReferrals]
  );

  useEffect(() => {
    let mounted = true;
    async function fetchReferrals() {
      try {
        const apiData = await referralApi.listReferrals();
        if (mounted && apiData.length > 0) {
          useReferralStore.getState().loadCustomDataset(apiData);
        }
      } catch (err) {
        console.warn("Could not load backend referrals in RuralOfficeDashboardPage:", err);
      }
    }
    fetchReferrals();
    return () => {
      mounted = false;
    };
  }, []);

  // Filters
  const [search, setSearch] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("All Facilities");
  const [triageFilter, setTriageFilter] = useState("All Triage Levels");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  // Single Dedicated Block Officer Auth Modal
  const [blockAuthOpen, setBlockAuthOpen] = useState(() => searchParams.get("create") === "true" && !isOfficer);

  // New CHC/PHC Referral Modal (To Regional Hospital)
  const [isNewModalOpen, setIsNewModalOpen] = useState(() => searchParams.get("create") === "true" && isOfficer);
  const [newGeo, setNewGeo] = useState<GeoValue>({
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Belur Village",
  });

  const [newPatientName, setNewPatientName] = useState("");
  const [newAgeGender, setNewAgeGender] = useState("");
  const [newFromFacility, setNewFromFacility] = useState("Belur Community Health Centre (CHC)");
  const [newToFacility, setNewToFacility] = useState("Regional Hospital");
  const [newTriage, setNewTriage] = useState<UnifiedReferral["triageLevel"]>("RED");
  const [newSpecialty, setNewSpecialty] = useState("Emergency Cardiology");
  const [newDoctor] = useState("Dr. A. Sen (Chief Specialist)");
  const [newTransport, setNewTransport] = useState("108 ALS Ambulance");
  const [newReason, setNewReason] = useState("");

  // Escalate to Regional Hospital Modal
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [selectedReferralToEscalate, setSelectedReferralToEscalate] = useState<UnifiedReferral | null>(null);
  const [escalateHospital, setEscalateHospital] = useState("Regional Hospital");
  const [escalateDoctor, setEscalateDoctor] = useState("Dr. A. Sen (Regional Hospital Specialist)");
  const [escalateTransport, setEscalateTransport] = useState("108 ALS Ambulance");
  const [escalateNotes, setEscalateNotes] = useState("");

  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false);
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState<PatientCase | null>(null);

  const handleOpenRecordForReferral = (item: UnifiedReferral) => {
    setSelectedPatientForRecord(mapUnifiedToPatientCase(item));
    setRecordDrawerOpen(true);
  };

  // Strict Facility Scoping: Block officer only sees referrals at their own facility
  const blockReferrals = useMemo(() => {
    if (!blockOfficerUser) return [];

    const fac = (blockOfficerUser.facilityOrVillage || "").toLowerCase();

    return list.filter((r) => {
      if (!r) return false;
      const isBlockTier = r.sourceLevel === "BLOCK" || r.targetLevel === "BLOCK_OFFICE";
      if (!isBlockTier) return false;

      const toFac = (r.toFacility || "").toLowerCase();
      const fromFac = (r.fromFacilityOrWorker || "").toLowerCase();

      // Facility matching against authenticated officer facility
      if (fac.includes("belur") || fac.includes("diamond harbour")) {
        return toFac.includes("belur") || fromFac.includes("belur") || toFac.includes("diamond harbour") || fromFac.includes("diamond harbour");
      }
      if (fac.includes("joypur")) {
        return toFac.includes("joypur") || fromFac.includes("joypur");
      }
      if (fac.includes("sonamukhi")) {
        return toFac.includes("sonamukhi") || fromFac.includes("sonamukhi");
      }
      if (fac.includes("kotulpur")) {
        return toFac.includes("kotulpur") || fromFac.includes("kotulpur");
      }

      // Generic match fallback
      return toFac.includes(fac) || fromFac.includes(fac) || fac.includes(toFac);
    });
  }, [list, blockOfficerUser]);

  const filteredReferrals = useMemo(() => {
    const q = safeStr(search).toLowerCase().trim();

    return blockReferrals.filter((item) => {
      if (!item) return false;
      const pName = safeStr(item.patientName).toLowerCase();
      const pId = safeStr(item.patientId).toLowerCase();
      const refId = safeStr(item.id).toLowerCase();
      const fromWorker = safeStr(item.fromFacilityOrWorker).toLowerCase();
      const toFac = safeStr(item.toFacility).toLowerCase();
      const village = safeStr(item.village).toLowerCase();
      const block = safeStr(item.block).toLowerCase();

      const matchSearch =
        !q ||
        pName.includes(q) ||
        pId.includes(q) ||
        refId.includes(q) ||
        fromWorker.includes(q) ||
        toFac.includes(q) ||
        village.includes(q) ||
        block.includes(q);

      const matchFacility =
        facilityFilter === "All Facilities" ||
        safeStr(item.fromFacilityOrWorker).includes(facilityFilter) ||
        safeStr(item.toFacility).includes(facilityFilter);

      const matchTriage =
        triageFilter === "All Triage Levels" || item.triageLevel === triageFilter;

      const matchStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      return matchSearch && matchFacility && matchTriage && matchStatus;
    });
  }, [blockReferrals, search, facilityFilter, triageFilter, statusFilter]);

  // Stats
  const totalBlockCases = blockReferrals.length;
  const fromAshaCount = blockReferrals.filter((r) => r && r.sourceLevel === "ASHA").length;
  const escalatedToDistrictCount = blockReferrals.filter(
    (r) => r && r.status === "Escalated to District"
  ).length;
  const redEmergencyCount = blockReferrals.filter((r) => r && r.triageLevel === "RED").length;

  const handleOpenNewModal = () => {
    if (!isOfficer) {
      setBlockAuthOpen(true);
      return;
    }
    setIsNewModalOpen(true);
  };

  const handleCreateBlockReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newPatId = `PAT-${Math.floor(9100 + Math.random() * 900)}`;
    const reasonText = newReason || "Referred from Block Office to District Hospital for specialized evaluation.";

    try {
      const ageMatch = (newAgeGender || "48 M").match(/\d+/);
      const parsedAge = ageMatch ? Number(ageMatch[0]) : 48;
      const sex = /\bF\b/i.test(newAgeGender) ? "female" : /\bM\b/i.test(newAgeGender) ? "male" : "other";
      const careEpisodeId = `EP-${newPatId}`;
      await ensurePatientAndEpisode({ patientId: newPatId, patientName: newPatientName, age: parsedAge, sex, villageOrWard: newGeo.village, careEpisodeId, createdBy: blockOfficerUser?.id || "demo-doctor-001" });
      const created = await referralApi.createReferral({
        patientId: newPatId, careEpisodeId,
        priority: newTriage === "RED" ? "CRITICAL" : newTriage === "YELLOW" ? "HIGH" : "MEDIUM",
        reason: reasonText,
        createdBy: blockOfficerUser?.id || "demo-doctor-001",
        fromFacilityId: "MED-WB-FAC-000372",
        toFacilityId: "MED-WB-FAC-000349",
        currentState: "EMERGENCY_ESCALATED",
      });

      addBlockReferral({
        ...created,
        patientName: newPatientName,
        patientId: newPatId,
        ageGender: newAgeGender || "48 M",
        state: newGeo.state,
        district: newGeo.district,
        block: newGeo.block,
        village: newGeo.village,
        fromFacilityOrWorker: newFromFacility,
        toFacility: newToFacility,
        category: newSpecialty,
        priority: newTriage === "RED" ? "Emergency" : newTriage === "YELLOW" ? "High" : "Normal",
        triageLevel: newTriage,
        status: "Escalated to District",
        assignedDoctor: newDoctor,
        clinicalNotes: reasonText,
        escortTransport: newTransport,
      });
    } catch {
      const ageMatch = (newAgeGender || "48 M").match(/\d+/);
      const parsedAge = ageMatch ? Number(ageMatch[0]) : 48;
      const sex = /\bF\b/i.test(newAgeGender) ? "female" : /\bM\b/i.test(newAgeGender) ? "male" : "other";
      try {
        const queued = await queueReferralOfflineFirst({
          patientId: newPatId, patientName: newPatientName, age: parsedAge, sex, villageOrWard: newGeo.village,
          careEpisodeId: `EP-${newPatId}`, fromFacilityId: "MED-WB-FAC-000372", toFacilityId: "MED-WB-FAC-000349",
          reason: reasonText, createdBy: blockOfficerUser?.id || "demo-doctor-001",
          priority: newTriage === "RED" ? "CRITICAL" : newTriage === "YELLOW" ? "HIGH" : "MEDIUM",
        });
        addBlockReferral({ ...queued, patientName: newPatientName, patientId: newPatId, ageGender: newAgeGender || "48 M", state: newGeo.state, district: newGeo.district, block: newGeo.block, village: newGeo.village, fromFacilityOrWorker: newFromFacility, toFacility: newToFacility, category: newSpecialty, priority: newTriage === "RED" ? "Emergency" : newTriage === "YELLOW" ? "High" : "Normal", triageLevel: newTriage, status: "Escalated to District", assignedDoctor: newDoctor, clinicalNotes: reasonText, escortTransport: newTransport });
      } catch (queueErr) {
        console.error("Block referral could not be saved online or queued offline:", queueErr);
        throw queueErr;
      }
    }

    setIsNewModalOpen(false);
    setNewPatientName("");
    setNewAgeGender("");
    setNewReason("");
  };

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferralToEscalate) return;

    try {
      await referralApi.transitionReferral(
        selectedReferralToEscalate.id,
        "EMERGENCY_ESCALATED",
        escalateNotes || "Escalated to District Hospital"
      );
    } catch {
      try {
        await queueReferralTransitionOfflineFirst(selectedReferralToEscalate.id, "EMERGENCY_ESCALATED", escalateNotes || "Escalated to District Hospital");
      } catch (queueErr) {
        console.error("Escalation could not be synchronized or queued:", queueErr);
        return;
      }
    }

    escalateToDistrict(
      selectedReferralToEscalate.id,
      escalateHospital,
      escalateDoctor,
      escalateTransport,
      escalateNotes
    );

    setIsEscalateModalOpen(false);
    setSelectedReferralToEscalate(null);
    setEscalateNotes("");
  };

  const clearFilters = () => {
    setSearch("");
    setFacilityFilter("All Facilities");
    setTriageFilter("All Triage Levels");
    setStatusFilter("All Statuses");
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="min-h-screen flex-1 md:ml-64 p-4 sm:p-6 md:p-8">
          {/* Dedicated Role-Scoped Portal Header */}
          <PortalHeader
            portalName={tPortal("blockPortalTitle", "Community Health Centre (CHC)", language)}
            portalIcon="domain"
            tierBadge={tPortal("blockPortalTier", "Community Health Centre (CHC) Tier", language)}
            themeColor="indigo"
            user={blockOfficerUser}
            onLogout={logoutBlockOfficer}
            onOpenAuth={() => setBlockAuthOpen(true)}
            allReferralsPath="/"
            actionButton={
              isOfficer ? (
                <button
                  type="button"
                  onClick={handleOpenNewModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-800 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>{tPortal("createBlockReferral", "Create CHC Referral")}</span>
                </button>
              ) : null
            }
          />

          {!isOfficer ? (
            /* LOCK SCREEN CARD: ZERO PATIENT DATA VISIBLE */
            <div className="mx-auto max-w-xl py-6 sm:py-10">
              <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 mb-4">
                  <span className="material-symbols-outlined text-4xl">lock</span>
                </div>
                <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-700 mb-2">
                  {tPortal("blockPortalTier", "Community Health Centre (CHC) Tier")}
                </span>
                <h2 className="text-2xl font-bold text-on-surface">{tPortal("blockAuthRequired", "CHC Medical Officer Authentication Required")}</h2>
                <p className="mt-2 text-sm text-on-surface-variant max-w-md mx-auto">
                  {tPortal("blockAuthDesc", "Access to CHC / PHC triage, bed allocation, and emergency escalation requires verified MOIC / BMOH credentials.")}
                </p>

                <div className="mt-6 border-t border-outline-variant pt-6 text-left">
                  <button
                    type="button"
                    onClick={() => setBlockAuthOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-700 py-3.5 px-6 font-bold text-white shadow-md hover:bg-indigo-800 active:scale-[0.98] transition"
                  >
                    <span className="material-symbols-outlined">key</span>
                    <span>{tPortal("loginAsBlockOfficer", "Login as CHC Officer")}</span>
                  </button>

                  <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-2">
                      <span className="material-symbols-outlined text-base text-indigo-700">badge</span>
                      <span>Registered CHC Medical Officers (Registry Database):</span>
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold text-on-surface">Dr. Anirban Roy (BHO-WB-204)</p>
                          <p className="text-[11px] text-on-surface-variant">Belur PHC / CHC • PIN: 4321</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("BHO-WB-204", "4321", "block_officer");
                          }}
                          className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-700 hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold text-on-surface">Dr. P. Mukherjee (BHO-WB-205)</p>
                          <p className="text-[11px] text-on-surface-variant">Joypur CHC • PIN: 4321</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("BHO-WB-205", "4321", "block_officer");
                          }}
                          className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-700 hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <Link
                      to="/#portals"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>Return to Portal Chooser</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED CHC PORTAL CONTENT */
            <div className="space-y-6">
              {/* Geographic Hierarchy Context & Quick Navigation to Secondary Services */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-indigo-900 font-medium">
                  <span className="material-symbols-outlined text-base text-indigo-700">domain</span>
                  <span><strong>CHC Command Tier:</strong> West Bengal → Bankura District → Joypur & Belur CHC / PHC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-bold text-indigo-800">
                    {blockOfficerUser?.facilityOrVillage || "Community Health Centre (CHC)"}
                  </span>
                  <Link
                    to="/dashboard/medicines"
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                  >
                    <span className="material-symbols-outlined text-sm">medication</span>
                    <span>Medicines</span>
                  </Link>
                  <Link
                    to="/dashboard/diagnostics"
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                  >
                    <span className="material-symbols-outlined text-sm">biotech</span>
                    <span>Diagnostics</span>
                  </Link>
                </div>
              </div>

            {/* KPI Metric Cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[140px] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface-variant break-words">{tPortal("blockCaseload", "CHC Referral Queue")}</p>
                    <h3 className="mt-2 text-3xl font-bold text-on-surface">{totalBlockCases}</h3>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
                    <span className="material-symbols-outlined">domain</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant break-words">{tPortal("allBlockCases", "Active at this CHC / PHC")}</p>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[140px] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface-variant break-words">{tPortal("villageReferrals", "Received From ASHA")}</p>
                    <h3 className="mt-2 text-3xl font-bold text-primary">{fromAshaCount}</h3>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">volunteer_activism</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant break-words">{tPortal("villageCases", "Frontline village incoming")}</p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[140px] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-800 break-words">{tPortal("emergencyRedTriage", "Emergency Red Triage")}</p>
                    <h3 className="mt-2 text-3xl font-bold text-red-900">{redEmergencyCount}</h3>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                    <span className="material-symbols-outlined">crisis_alert</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-red-700 font-medium break-words">{tPortal("criticalCare", "Critical patient care")}</p>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[140px] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface-variant break-words">{tPortal("escalatedToDistrict", "Escalated To Regional Hospital")}</p>
                    <h3 className="mt-2 text-3xl font-bold text-indigo-700">{escalatedToDistrictCount}</h3>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
                    <span className="material-symbols-outlined">local_hospital</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant break-words">{tPortal("tertiaryTransfers", "Regional hospital transfers")}</p>
              </div>
            </section>

            {/* Filter Section */}
            <section className="rounded-3xl border border-outline-variant bg-surface-container-low p-5">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold">{tPortal("blockTriageHeading", "Community Health Centre (CHC) Patient Triage & Escalations")}</h2>
                  <p className="text-sm text-on-surface-variant">
                    {tPortal("blockTriageSubheading", "Incoming village referrals from ASHA and outgoing escalations to Regional Hospital")}
                  </p>
                </div>
                <span className="rounded-full bg-surface-container px-4 py-1.5 text-sm font-medium text-on-surface-variant">
                  {filteredReferrals.length} {tPortal("inQueue", "in queue")}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[2fr_1.2fr_1fr_1.2fr_auto]">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tPortal("searchBlockPlaceholder", "Search patient, referral ID, facility, village...")}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-10 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                  />
                </div>

                <select
                  value={facilityFilter}
                  onChange={(e) => setFacilityFilter(e.target.value)}
                  className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                >
                  {FACILITY_FILTER_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f === "All Facilities" ? tPortal("allFacilities", "All Facilities") : f}
                    </option>
                  ))}
                </select>

                <select
                  value={triageFilter}
                  onChange={(e) => setTriageFilter(e.target.value)}
                  className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                >
                  {TRIAGE_FILTER_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t === "All Triage Levels" ? tPortal("allTriageLevels", "All Triage Levels") : `Triage ${t}`}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                >
                  {STATUS_FILTER_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "All Statuses" ? tPortal("allStatuses", "All Statuses") : s}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container"
                >
                  {tPortal("clearFilters", "Clear")}
                </button>
              </div>
            </section>

            {/* Referrals Queue Table */}
            <section className="overflow-hidden rounded-3xl border border-outline-variant bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="border-b border-outline-variant bg-surface-container-low">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {tPortal("patientAndGeo", "Patient & Geography")}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {tPortal("flowPathway", "Flow Pathway")}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {tPortal("triageAndUrgency", "Triage & Urgency")}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {tPortal("assignedClinician", "Assigned Clinician")}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {tPortal("statusAndAction", "Status & Action")}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {tPortal("management", "Management")}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-outline-variant">
                    {filteredReferrals.map((item) => (
                      <tr key={item.id} className="transition hover:bg-surface-container-low">
                        {/* Patient & Geography */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-on-surface">{item.patientName}</p>
                          <p className="text-xs text-on-surface-variant">
                            {item.patientId} • {item.ageGender}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                            {item.id}
                          </p>
                          <p className="mt-1 text-[11px] text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                            {item.village}, {item.block} ({item.district})
                          </p>
                        </td>

                        {/* Pathway */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                              From: <strong className="text-on-surface">{item.fromFacilityOrWorker}</strong>
                            </span>
                            <span className="text-indigo-800 flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              To: <strong className="text-indigo-950">{item.toFacility}</strong>
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 max-w-[220px] text-[11px] text-on-surface-variant" title={item.clinicalNotes}>
                            {item.clinicalNotes}
                          </p>
                        </td>

                        {/* Triage */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              item.triageLevel === "RED"
                                ? "bg-red-100 text-red-800 animate-pulse"
                                : item.triageLevel === "YELLOW"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            Triage {item.triageLevel}
                          </span>
                        </td>

                        {/* Clinician */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm text-on-surface">
                            {item.assignedDoctor || "Block Duty Doctor"}
                          </p>
                          <span className="inline-block rounded bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant mt-1">
                            {item.category}
                          </span>
                        </td>

                        {/* Status & 6-Stage Continuum Stepper */}
                        <td className="px-6 py-4">
                          <ReferralStatusStepper currentStage={item.status} isCompact />
                          <p className="mt-1 text-[11px] text-on-surface-variant line-clamp-1 max-w-[200px]" title={item.lastAction}>
                            {item.lastAction}
                          </p>
                        </td>

                        {/* Management Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.status !== "Escalated to District" && (item.status as string) !== "Escalated to Regional Hospital" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isOfficer) {
                                    setBlockAuthOpen(true);
                                    return;
                                  }
                                  setSelectedReferralToEscalate(item);
                                  setIsEscalateModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800 transition hover:bg-red-200"
                              >
                                <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                                {tPortal("escalateToDistrict", "Escalate To Regional Hospital")}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenRecordForReferral(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                              title={tPortal("viewRecord", "View Longitudinal Health Record")}
                            >
                              <span className="material-symbols-outlined text-[15px]">history_edu</span>
                              <span>{tPortal("viewRecord", "Record")}</span>
                            </button>

                            <Link
                              to={`/dashboard/referrals/${item.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                            >
                              {tPortal("management", "Manage")}
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredReferrals.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                    <span className="material-symbols-outlined text-2xl">search_off</span>
                  </div>
                  <h3 className="mt-3 font-bold">No referrals in CHC / PHC queue</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Try modifying facility filters or search terms.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      </div>

      {/* =========================================================
          MODAL: CREATE NEW CHC REFERRAL (REFER TO REGIONAL HOSPITAL)
      ========================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-surface p-6 md:p-8 shadow-2xl border border-outline-variant">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
                  <span className="material-symbols-outlined text-2xl">domain</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Create CHC Referral</h2>
                  <p className="text-xs text-on-surface-variant">
                    Refer patient from CHC/PHC <strong>To Regional Hospital</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBlockReferral} className="mt-5 space-y-5">
              {/* Reusable Geographic Cascade (State -> District -> Block -> Village) */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">pin_drop</span>
                  Administrative Location Hierarchy (State → District → Block → Village)
                </p>

                <GeoCascadeSelect
                  value={newGeo}
                  onChange={setNewGeo}
                  required
                />
              </div>


              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Das"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Age & Gender *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgeGender}
                    onChange={(e) => setNewAgeGender(e.target.value)}
                    placeholder="e.g. 48 M"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Referring CHC/PHC Facility
                  </label>
                  <select
                    value={newFromFacility}
                    onChange={(e) => setNewFromFacility(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  >
                    <option value="Belur PHC / CHC">Belur PHC / CHC</option>
                    <option value="Joypur CHC">Joypur CHC</option>
                    <option value="Sonamukhi Rural Hospital (CHC)">Sonamukhi Rural Hospital (CHC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Destination (To Regional Hospital) *
                  </label>
                  <select
                    value={newToFacility}
                    onChange={(e) => setNewToFacility(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  >
                    <option value="Bankura Regional Hospital">Bankura Regional Hospital</option>
                    <option value="Regional Medical College & Tertiary Hospital">Regional Medical College & Tertiary Hospital</option>
                    <option value="Regional Mother & Child Speciality Hospital">Regional Mother & Child Speciality Hospital</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Triage Urgency
                  </label>
                  <select
                    value={newTriage}
                    onChange={(e) => setNewTriage(e.target.value as UnifiedReferral["triageLevel"])}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  >
                    <option value="RED">RED (Immediate Emergency)</option>
                    <option value="YELLOW">YELLOW (Urgent)</option>
                    <option value="GREEN">GREEN (Routine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Specialty Required
                  </label>
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="e.g. Cardiology, Surgery"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Ambulance Transport
                  </label>
                  <select
                    value={newTransport}
                    onChange={(e) => setNewTransport(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  >
                    <option value="108 ALS Ambulance">108 ALS Ambulance (Critical)</option>
                    <option value="108 BLS Ambulance">108 BLS Ambulance</option>
                    <option value="Hospital Transfer Van">Hospital Transfer Van</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Clinical Summary & Escalation Justification
                </label>
                <textarea
                  rows={3}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Clinical presentation, vitals, failed conservative stabilization, and required tertiary intervention..."
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-800"
                >
                  Submit Referral To Regional Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ESCALATE EXISTING CASE TO REGIONAL HOSPITAL
      ========================================================= */}
      {isEscalateModalOpen && selectedReferralToEscalate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl border border-outline-variant">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-800">
                  <span className="material-symbols-outlined text-2xl">emergency</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Escalate Case To Regional Hospital</h2>
                  <p className="text-xs text-on-surface-variant">
                    Patient: {selectedReferralToEscalate.patientName} ({selectedReferralToEscalate.patientId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleEscalateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Destination Regional Hospital
                </label>
                <select
                  value={escalateHospital}
                  onChange={(e) => setEscalateHospital(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="Bankura Regional Hospital">Bankura Regional Hospital</option>
                  <option value="Regional Medical College & Tertiary Hospital">Regional Medical College & Tertiary Hospital</option>
                  <option value="Regional Mother & Child Speciality Hospital">Regional Mother & Child Speciality Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Receiving Consultant / Department
                </label>
                <input
                  type="text"
                  value={escalateDoctor}
                  onChange={(e) => setEscalateDoctor(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Ambulance & Transport Request
                </label>
                <select
                  value={escalateTransport}
                  onChange={(e) => setEscalateTransport(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="108 ALS Ambulance (Advance Life Support)">108 ALS Ambulance (Advance Life Support)</option>
                  <option value="108 BLS Ambulance (Basic Life Support)">108 BLS Ambulance (Basic Life Support)</option>
                  <option value="Hospital Transfer Van">Hospital Transfer Van</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Clinical Escalation Justification
                </label>
                <textarea
                  rows={3}
                  value={escalateNotes}
                  onChange={(e) => setEscalateNotes(e.target.value)}
                  placeholder="Summarize vital signs, reason patient cannot be stabilized at CHC/PHC, and urgency..."
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-800"
                >
                  Confirm Escalation To Regional Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Block Health Officer Auth Modal */}
      <BlockOfficeAuthModal
        isOpen={blockAuthOpen}
        onClose={() => setBlockAuthOpen(false)}
        onSuccess={() => setIsNewModalOpen(true)}
      />

      {/* Task 2: Longitudinal Patient Record Drawer */}
      <PatientRecordDrawer
        patient={selectedPatientForRecord}
        isOpen={recordDrawerOpen}
        onClose={() => setRecordDrawerOpen(false)}
      />
    </div>
  );
}
