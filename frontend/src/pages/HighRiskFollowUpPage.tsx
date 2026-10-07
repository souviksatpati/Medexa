import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useAuth } from "@/auth/auth";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { referralApi, type FollowUpTaskOut } from "@/api/referralApi";

interface PatientFollowUpHistory {
  date: string;
  stage: string;
  notes: string;
}

interface FollowUpPatient {
  id: string; name: string; age: number; gender: "Male" | "Female"; condition: string;
  risk: "High" | "Moderate"; followUp: string; facility: string;
  status: "Due Today" | "Scheduled" | "Overdue"; phone: string; abhaId: string; village: string;
  assignedDoctor: string; clinicalNotes: string; riskFactors: string[];
  vitals: { bp: string; pulse: string; spo2: string; temp: string; weight: string };
  history: PatientFollowUpHistory[];
}

function statusStyle(status: FollowUpPatient["status"]) {
  if (status === "Overdue") {
    return "bg-red-100 text-red-700 border border-red-300";
  }

  if (status === "Due Today") {
    return "bg-yellow-100 text-yellow-800 border border-yellow-300";
  }

  return "bg-emerald-100 text-emerald-800 border border-emerald-300";
}

export function HighRiskFollowUpPage() {
  const { user } = useAuth();
  const { tPortal, language } = useLanguageStore();
  const [selectedPatient, setSelectedPatient] = useState<FollowUpPatient | null>(null);
  const [backendTasks, setBackendTasks] = useState<FollowUpTaskOut[]>([]);
  const [, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const backendAssignedTo = user?.role === "ASHA" ? "demo-asha-001" : undefined;
    referralApi.getFollowUps(backendAssignedTo)
      .then((tasks) => { if (mounted) setBackendTasks(tasks); })
      .catch((err) => { if (mounted) setLoadError(err instanceof Error ? err.message : "Unable to load follow-up tasks"); });
    return () => { mounted = false; };
  }, [user?.role]);

  const activeFacility = user?.facilityOrVillage || user?.facility || "Assigned health facility";

  const [nowTimestamp] = useState(() => Date.now());

  const patients = useMemo<FollowUpPatient[]>(() => backendTasks.map((t) => {
    const overdue = t.status === "overdue" || new Date(t.due_at).getTime() < nowTimestamp;
    return {
      id: t.id,
      name: `Follow-up task ${t.id.slice(-6)}`,
      age: 0, gender: "Female",
      condition: t.reason || "Continuity follow-up care",
      risk: overdue ? "High" : "Moderate",
      followUp: overdue ? "Overdue" : new Date(t.due_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      facility: activeFacility,
      status: overdue ? "Overdue" : "Scheduled",
      phone: "—", abhaId: "Synthetic demo record", village: "Linked care episode",
      assignedDoctor: t.assigned_to || "Assigned field worker",
      clinicalNotes: t.reason || "Scheduled follow-up adherence visit",
      riskFactors: ["Continuity follow-up required", `Care episode: ${t.care_episode_id}`],
      vitals: { bp: "—", pulse: "—", spo2: "—", temp: "—", weight: "—" },
      history: [{ date: t.due_at.slice(0, 10), stage: "Continuity Task", notes: t.reason || "Follow-up due" }],
    };
  }), [backendTasks, activeFacility, nowTimestamp]);

  const dueToday = patients.filter((p) => p.status === "Due Today").length;
  const scheduled = patients.filter((p) => p.status === "Scheduled").length;
  const overdue = patients.filter((p) => p.status === "Overdue").length;

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      <main className="min-h-screen md:ml-64">
        {/* HEADER */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {user?.role === "DISTRICT" ? "Regional Hospital Command" : user?.role === "BLOCK" ? "Community Health Centre (CHC) Office" : "ASHA Frontline Portal"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-on-surface">
                {tPortal("highRiskTitle", "High-Risk Follow-up", language)}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {tPortal("highRiskSubtitle", "Prioritize patients requiring immediate clinical attention and monitor adherence across the care continuum.", language)}
              </p>
            </div>

            {/* Scope Badge */}
            <div className="self-start sm:self-auto rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
              <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">
                Scoped Facility Jurisdiction
              </span>
              <span className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-sm">domain</span>
                <span className="truncate max-w-[240px]">{activeFacility}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8">
          {/* SUMMARY CARDS */}
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryCard
              title={tPortal("dueToday", "Due for Follow-Up Today")}
              value={dueToday}
              icon="today"
              colorClass="bg-amber-100 text-amber-800"
            />
            <SummaryCard
              title={tPortal("highRisk", "Scheduled")}
              value={scheduled}
              icon="event_available"
              colorClass="bg-emerald-100 text-emerald-800"
            />
            <SummaryCard
              title={tPortal("overdue", "Overdue")}
              value={overdue}
              icon="priority_high"
              colorClass="bg-red-100 text-red-700"
              danger
            />
          </div>

          {/* PATIENT LIST */}
          <div className="rounded-3xl border border-outline-variant bg-surface p-5 md:p-7 shadow-xs">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-outline-variant/60">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  {tPortal("totalHighRisk", "Patients Requiring Follow-up")}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Showing records assigned strictly to <strong className="text-on-surface">{activeFacility}</strong>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-container border border-outline-variant self-start">
                {patients.length} Active Records
              </span>
            </div>

            {/* COLUMN HEADERS */}
            <div className="mb-3 hidden px-5 lg:grid lg:grid-cols-[minmax(220px,1.3fr)_100px_110px_minmax(180px,1.1fr)_260px] lg:items-center lg:gap-4">
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("patientAndGeo", "Patient")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("triageLevel", "Risk")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("lastContact", "Follow-up")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("facilities", "Facility")}
              </div>
              <div className="text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("status", "Status & Actions")}
              </div>
            </div>

            {/* PATIENT ROWS */}
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="rounded-2xl border border-outline-variant p-5 transition hover:shadow-sm hover:border-primary/40 bg-surface-container-lowest"
                >
                  <div className="grid items-center gap-4 lg:grid-cols-[minmax(220px,1.3fr)_100px_110px_minmax(180px,1.1fr)_260px]">
                    {/* PATIENT */}
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface text-sm">
                          {patient.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {patient.id} · {patient.age} yrs · {patient.gender}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-primary">
                          {patient.condition}
                        </p>
                      </div>
                    </div>

                    {/* RISK */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Risk:</span>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          patient.risk === "High"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {patient.risk}
                      </span>
                    </div>

                    {/* FOLLOW-UP */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Follow-up:</span>
                      <span className="text-xs font-bold text-on-surface">
                        {patient.followUp}
                      </span>
                    </div>

                    {/* FACILITY */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Facility:</span>
                      <span className="text-xs font-semibold text-on-surface truncate block" title={patient.facility}>
                        {patient.facility}
                      </span>
                    </div>

                    {/* STATUS + VIEW PATIENT DETAILS ACTION */}
                    <div className="flex items-center gap-2 lg:justify-end">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(
                          patient.status
                        )}`}
                      >
                        {patient.status}
                      </span>

                      {/* View Patient Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(patient)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-bold text-indigo-800 transition hover:bg-indigo-100 shadow-2xs"
                        title="View clinical notes, vitals, risk factors, and history"
                      >
                        <span className="material-symbols-outlined text-[15px]">clinical_notes</span>
                        <span>View Details</span>
                      </button>

                      <Link
                        to={`/episode/${patient.id}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-on-primary transition hover:bg-primary-hover shadow-2xs"
                      >
                        <span>Episode</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* PATIENT DETAILS MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-on-surface">{selectedPatient.name}</h2>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${
                        selectedPatient.risk === "High"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {selectedPatient.risk} Risk
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {selectedPatient.id} • {selectedPatient.age} yrs • {selectedPatient.gender} • ABHA: <span className="font-mono font-semibold">{selectedPatient.abhaId}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Quick Demographics Bar */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-surface-container-low p-3 text-xs">
              <div>
                <span className="text-on-surface-variant text-[11px] block">Location:</span>
                <span className="font-bold text-on-surface">{selectedPatient.village}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[11px] block">Contact:</span>
                <span className="font-bold text-on-surface">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[11px] block">Assigned Doctor:</span>
                <span className="font-bold text-on-surface">{selectedPatient.assignedDoctor}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[11px] block">Follow-up:</span>
                <span className="font-bold text-indigo-700">{selectedPatient.followUp} ({selectedPatient.status})</span>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-red-600">monitor_heart</span>
                Current Vitals
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Blood Pressure</span>
                  <span className="text-sm font-bold text-red-700">{selectedPatient.vitals.bp}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Pulse</span>
                  <span className="text-sm font-bold text-on-surface">{selectedPatient.vitals.pulse}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">SpO2</span>
                  <span className="text-sm font-bold text-emerald-700">{selectedPatient.vitals.spo2}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Temperature</span>
                  <span className="text-sm font-bold text-on-surface">{selectedPatient.vitals.temp}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Weight</span>
                  <span className="text-sm font-bold text-on-surface">{selectedPatient.vitals.weight}</span>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                Clinical Risk Factors
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedPatient.riskFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-800"
                  >
                    • {factor}
                  </span>
                ))}
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-indigo-700">description</span>
                Clinical Assessment Notes
              </h3>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs text-on-surface leading-relaxed">
                {selectedPatient.clinicalNotes}
              </div>
            </div>

            {/* Follow-up History Timeline */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">history</span>
                Follow-up History & Milestones
              </h3>
              <div className="space-y-2 border-l-2 border-primary/20 pl-4 ml-2">
                {selectedPatient.history.map((item, idx) => (
                  <div key={idx} className="relative pb-2">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-on-surface">{item.stage}</span>
                      <span className="text-[11px] font-mono text-on-surface-variant">({item.date})</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl border border-outline-variant px-5 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Close Dossier
              </button>
              <Link
                to={`/episode/${selectedPatient.id}`}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary hover:bg-primary-hover shadow-sm"
              >
                Open Full Episode
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  colorClass: string;
  danger?: boolean;
}

function SummaryCard({ title, value, icon, colorClass, danger = false }: SummaryCardProps) {
  return (
    <div
      className={`rounded-3xl border p-5 sm:p-6 transition shadow-2xs ${
        danger ? "border-red-200 bg-red-50/40" : "border-outline-variant bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-on-surface tracking-tight">
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
