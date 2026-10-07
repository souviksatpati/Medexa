import React from "react";
import type { PatientCase } from "../../sync/mockPatientCases";

interface PatientRecordDrawerProps {
  patient: PatientCase | null;
  isOpen: boolean;
  onClose: () => void;
  onStartTeleconsult?: (patient: PatientCase) => void;
  onStartEpisode?: (patient: PatientCase) => void;
}

export const PatientRecordDrawer: React.FC<PatientRecordDrawerProps> = ({
  patient,
  isOpen,
  onClose,
  onStartTeleconsult,
  onStartEpisode,
}) => {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  if (!isOpen || !patient) return null;

  const handleSpeakFullRecord = () => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narration = [
      `Longitudinal Health Record for ${patient.name}.`,
      `Age ${patient.age}, from ${patient.village}, ${patient.block}.`,
      `ABHA Identification: ${patient.abhaId}.`,
      `Assigned risk level is ${patient.riskLevel}. Current condition: ${patient.condition}.`,
      `Current Vitals: Blood pressure is ${patient.vitals.bp}, Pulse is ${patient.vitals.pulse}, Oxygen saturation is ${patient.vitals.spo2}, Temperature is ${patient.vitals.temp}.`,
      `Latest update notes: ${patient.notes}`,
      `History includes ${patient.timeline.length} recorded healthcare episodes.`,
      patient.timeline.map((ev, i) => `Episode ${i + 1} at ${ev.facility}: ${ev.title}. ${ev.description}`).join(". "),
    ].join(" ");

    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getRiskColor = (risk: PatientCase["riskLevel"]) => {
    switch (risk) {
      case "RED":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "YELLOW":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "GREEN":
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-16">
        <div className="w-screen max-w-2xl bg-surface shadow-2xl flex flex-col">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">
                account_circle
              </span>
              <div>
                <h2 className="text-lg font-bold text-on-surface leading-tight">
                  Longitudinal Health Record
                </h2>
                <p className="text-xs text-on-surface-variant">
                  ABHA Compliant Digital Health Locker (EHR)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpeakFullRecord}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  isSpeaking
                    ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                    : "bg-surface border-outline-variant text-primary hover:bg-primary/10"
                }`}
                title="Narrate entire record via Text-to-Speech"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isSpeaking ? "stop_circle" : "record_voice_over"}
                </span>
                <span>{isSpeaking ? "Stop Voice" : "Read Aloud"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
                title="Close drawer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Patient Identity Banner */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-800 text-white font-black text-xl shadow-md">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-on-surface">
                        {patient.name}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${getRiskColor(
                          patient.riskLevel
                        )}`}
                      >
                        {patient.riskLevel} PRIORITY
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                      {patient.age} years old • {patient.gender} • {patient.phone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    ABHA: {patient.abhaId}
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-1">
                    PID: {patient.id}
                  </span>
                </div>
              </div>

              {/* Geographic Coordinates */}
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                <span>📍 Village: <strong className="text-slate-800">{patient.village}</strong></span>
                <span>🏛️ Block: <strong className="text-slate-800">{patient.block}</strong></span>
                <span>🗺️ District: <strong className="text-slate-800">{patient.district}</strong></span>
                <span>👩‍⚕️ ASHA: <strong className="text-slate-800">{patient.assignedAsha}</strong></span>
              </div>
            </div>

            {/* Current Vitals Panel */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">vital_signs</span>
                Current Measured Vitals
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Blood Pressure</span>
                  <p className="text-base font-black text-slate-800 mt-0.5">{patient.vitals.bp}</p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Pulse</span>
                  <p className="text-base font-black text-slate-800 mt-0.5">{patient.vitals.pulse}</p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase">SpO2 (Oxygen)</span>
                  <p
                    className={`text-base font-black mt-0.5 ${
                      parseInt(patient.vitals.spo2) < 92 ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {patient.vitals.spo2}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Body Temp</span>
                  <p className="text-base font-black text-slate-800 mt-0.5">{patient.vitals.temp}</p>
                </div>
                {patient.vitals.bloodSugar && (
                  <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Blood Sugar</span>
                    <p className="text-base font-black text-slate-800 mt-0.5">{patient.vitals.bloodSugar}</p>
                  </div>
                )}
                {patient.vitals.hb && (
                  <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Hemoglobin</span>
                    <p className="text-base font-black text-slate-800 mt-0.5">{patient.vitals.hb}</p>
                  </div>
                )}
                <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Body Weight</span>
                  <p className="text-base font-black text-slate-800 mt-0.5">{patient.vitals.weight}</p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-3 text-center">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Care Stage</span>
                  <p className="text-xs font-bold text-teal-800 mt-1 truncate">{patient.careStage}</p>
                </div>
              </div>
            </div>

            {/* Clinical Diagnosis & Triage Notes */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">medical_services</span>
                <span>Active Diagnosis & Clinical Condition</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-amber-950">
                {patient.condition}
              </p>
              <p className="mt-2 text-xs text-amber-900/90 leading-relaxed">
                <strong>Clinical Notes:</strong> {patient.notes}
              </p>
            </div>

            {/* Longitudinal Care Journey Timeline */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">timeline</span>
                  Multi-Encounter Longitudinal Journey ({patient.timeline.length} Events)
                </h4>
                <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Chronological Order
                </span>
              </div>

              <div className="relative border-l-2 border-primary/30 ml-4 pl-6 space-y-6">
                {patient.timeline.map((event, index) => (
                  <div key={event.id || index} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-[12px] font-bold ring-4 ring-surface">
                      {index + 1}
                    </div>

                    <div className="rounded-2xl border border-outline-variant bg-surface p-4 shadow-sm transition hover:border-primary/50">
                      {/* Event Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary">
                          {event.stage}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          📅 {event.date}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h5 className="mt-1 text-sm font-bold text-on-surface">
                        {event.title}
                      </h5>
                      <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                        {event.description}
                      </p>

                      {/* Facility & Clinician */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 bg-surface-container-low p-2 rounded-xl">
                        <span>🏥 <strong>Facility:</strong> {event.facility}</span>
                        {event.doctor && <span>👨‍⚕️ <strong>Provider:</strong> {event.doctor}</span>}
                      </div>

                      {/* Vitals Snapshot if present */}
                      {event.vitals && Object.keys(event.vitals).length > 0 && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                            Snapshot:
                          </span>
                          {Object.entries(event.vitals).map(([k, v]) => (
                            <span
                              key={k}
                              className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {k.toUpperCase()}: {v}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Prescriptions if present */}
                      {event.prescriptions && event.prescriptions.length > 0 && (
                        <div className="mt-2.5">
                          <span className="text-[10px] font-bold uppercase text-teal-800 block mb-1">
                            Prescribed Medications:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {event.prescriptions.map((rx, rxIdx) => (
                              <span
                                key={rxIdx}
                                className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-semibold text-teal-900"
                              >
                                <span className="material-symbols-outlined text-[13px] text-teal-600">
                                  medication
                                </span>
                                {rx}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="border-t border-outline-variant bg-surface-container-low p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition"
            >
              Close Record
            </button>

            <div className="flex items-center gap-2.5">
              {onStartTeleconsult && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartTeleconsult(patient);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-900 hover:bg-teal-100 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">video_call</span>
                  <span>Teleconsult</span>
                </button>
              )}

              {onStartEpisode && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartEpisode(patient);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>Update Episode</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
