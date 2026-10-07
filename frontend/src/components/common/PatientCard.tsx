import React from "react";
import type { PatientCase } from "../../sync/mockPatientCases";

interface PatientCardProps {
  patient: PatientCase;
  onSelectEpisode?: (patient: PatientCase) => void;
  onOpenTimeline?: (patient: PatientCase) => void;
  onOpenTeleconsult?: (patient: PatientCase) => void;
  onEmergencyEscalate?: (patient: PatientCase) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onSelectEpisode,
  onOpenTimeline,
  onOpenTeleconsult,
  onEmergencyEscalate,
}) => {
  const getRiskStyles = (risk: PatientCase["riskLevel"]) => {
    switch (risk) {
      case "RED":
        return {
          badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
          dotBg: "bg-rose-600 animate-pulse",
          cardBorder: "border-l-4 border-l-rose-500",
          label: "High Risk",
        };
      case "YELLOW":
        return {
          badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
          dotBg: "bg-amber-500",
          cardBorder: "border-l-4 border-l-amber-500",
          label: "Moderate",
        };
      case "GREEN":
      default:
        return {
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          dotBg: "bg-emerald-500",
          cardBorder: "border-l-4 border-l-emerald-500",
          label: "Stable",
        };
    }
  };

  const getStageStyles = (stage: PatientCase["careStage"]) => {
    switch (stage) {
      case "Triage / Referred":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Transit":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Consultation":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Treatment":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Back-Referred / Follow-up":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "Completed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const risk = getRiskStyles(patient.riskLevel);

  const handleSpeakSummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = `${patient.name}, age ${patient.age}, village ${patient.village}. Risk is ${patient.riskLevel}. Condition: ${patient.condition}. Blood pressure ${patient.vitals.bp}, oxygen ${patient.vitals.spo2}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl border border-outline-variant bg-surface p-4 shadow-sm transition hover:shadow-md sm:p-5 ${risk.cardBorder}`}
      aria-label={`Patient card for ${patient.name}`}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-base shadow-inner">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface leading-tight">
                  {patient.name}
                </h3>
                <button
                  type="button"
                  onClick={handleSpeakSummary}
                  title="Read patient summary aloud"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary transition"
                  aria-label="Speak patient summary"
                >
                  <span className="material-symbols-outlined text-[16px]">volume_up</span>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {patient.age} yrs • {patient.gender} • <span className="font-mono text-[11px] text-slate-500">{patient.id}</span>
              </p>
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${risk.badgeBg}`}
            >
              <span className={`h-2 w-2 rounded-full ${risk.dotBg}`} />
              {risk.label}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {patient.lastUpdated}
            </span>
          </div>
        </div>

        {/* Location & ABHA Row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
            {patient.village}, {patient.block}
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            <span className="material-symbols-outlined text-[13px] text-teal-600">verified</span>
            ABHA: {patient.abhaId}
          </span>
        </div>

        {/* Condition & Stage */}
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="rounded-md bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 text-[11px] font-semibold">
              {patient.conditionCategory}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getStageStyles(
                patient.careStage
              )}`}
            >
              {patient.careStage}
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface line-clamp-2 leading-relaxed">
            {patient.condition}
          </p>
        </div>

        {/* Vitals Ribbon */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-xl bg-surface-container-low p-2 text-center border border-outline-variant/60">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">BP</span>
            <span className="text-xs font-bold text-slate-800">{patient.vitals.bp.split(" ")[0]}</span>
          </div>
          <div className="flex flex-col border-l border-outline-variant/50">
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Pulse</span>
            <span className="text-xs font-bold text-slate-800">{patient.vitals.pulse.split(" ")[0]}</span>
          </div>
          <div className="flex flex-col border-l border-outline-variant/50">
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">SpO2</span>
            <span
              className={`text-xs font-bold ${
                parseInt(patient.vitals.spo2) < 92 ? "text-rose-600 font-extrabold" : "text-slate-800"
              }`}
            >
              {patient.vitals.spo2}
            </span>
          </div>
          <div className="flex flex-col border-l border-outline-variant/50">
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Temp</span>
            <span className="text-xs font-bold text-slate-800">{patient.vitals.temp}</span>
          </div>
        </div>

        {/* Facility & Doctor Info */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span className="truncate max-w-[60%]">
            🏥 {patient.referralFacility}
          </span>
          {patient.doctorName && (
            <span className="truncate font-medium text-slate-700">
              👨‍⚕️ {patient.doctorName}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons - 44px min touch target */}
      <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectEpisode?.(patient)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
          <span>Care Episode</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenTimeline?.(patient)}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-primary transition active:scale-[0.98]"
          title="View Longitudinal Health Record"
          aria-label="View Longitudinal Health Record"
        >
          <span className="material-symbols-outlined text-[18px]">history_edu</span>
          <span className="hidden sm:inline ml-1 text-xs">Record</span>
        </button>

        {onOpenTeleconsult && (
          <button
            type="button"
            onClick={() => onOpenTeleconsult(patient)}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition active:scale-[0.98]"
            title="Start Teleconsultation"
            aria-label="Start Teleconsultation"
          >
            <span className="material-symbols-outlined text-[18px]">video_call</span>
            <span className="hidden sm:inline ml-1 text-xs">Teleconsult</span>
          </button>
        )}

        {patient.riskLevel === "RED" && onEmergencyEscalate && (
          <button
            type="button"
            onClick={() => onEmergencyEscalate(patient)}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-rose-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm animate-pulse active:scale-[0.98]"
            title="Emergency 108 Dispatch"
            aria-label="Emergency 108 Dispatch"
          >
            <span className="material-symbols-outlined text-[18px]">e911_emergency</span>
          </button>
        )}
      </div>
    </article>
  );
};
