import { useState, useMemo } from "react";
import { z } from "zod";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { TriageAssessmentSchema, type ClinicalRiskLevelT } from "@/models/careEpisode";
import { db, writeAndQueue } from "@/sync/db";
import {
  calculateTriageRisk,
  type TriageRiskResult,
  SYMPTOM_WEIGHTS,
} from "@/utils/clinicalRiskEngine";

type TriageAssessment = z.infer<typeof TriageAssessmentSchema>;
interface TriageFormProps {
  careEpisodeId: string;
  workerId: string;
  onSubmitted: (riskLevel: ClinicalRiskLevelT, assessment?: TriageAssessment) => void;
}

const QUICK_SELECT_SYMPTOMS = [
  { name: "Chest Pain", weight: 4, tag: "Emergency (+4)" },
  { name: "Breathlessness", weight: 3, tag: "High (+3)" },
  { name: "Fever", weight: 2, tag: "Mod (+2)" },
  { name: "Vomiting", weight: 2, tag: "Mod (+2)" },
  { name: "Cough", weight: 1, tag: "Mild (+1)" },
];

interface VitalFieldConfig {
  key: "systolicBP" | "diastolicBP" | "pulse" | "tempC" | "spo2";
  label: string;
  unit: string;
  step?: number;
  normalRange: string;
}

const VITAL_FIELDS: VitalFieldConfig[] = [
  { key: "spo2", label: "Oxygen Saturation (SpO2)", unit: "%", step: 1, normalRange: "95–100%" },
  { key: "systolicBP", label: "Systolic Blood Pressure", unit: "mmHg", step: 1, normalRange: "90–130 mmHg" },
  { key: "diastolicBP", label: "Diastolic Blood Pressure", unit: "mmHg", step: 1, normalRange: "60–85 mmHg" },
  { key: "pulse", label: "Heart Rate / Pulse", unit: "bpm", step: 1, normalRange: "60–100 bpm" },
  { key: "tempC", label: "Body Temp", unit: "°C", step: 0.1, normalRange: "36.5–37.5 °C" },
];

export function TriageForm({ careEpisodeId, workerId, onSubmitted }: TriageFormProps) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState<Record<VitalFieldConfig["key"], string>>({
    systolicBP: "",
    diastolicBP: "",
    pulse: "",
    tempC: "",
    spo2: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageRiskResult | null>(null);

  // Live parsed vitals
  const parsedVitals = useMemo(() => ({
    systolicBP: vitals.systolicBP ? Number(vitals.systolicBP) : undefined,
    diastolicBP: vitals.diastolicBP ? Number(vitals.diastolicBP) : undefined,
    pulse: vitals.pulse ? Number(vitals.pulse) : undefined,
    tempC: vitals.tempC ? Number(vitals.tempC) : undefined,
    spo2: vitals.spo2 ? Number(vitals.spo2) : undefined,
  }), [vitals]);

  // Live real-time risk assessment
  const liveRisk = useMemo(() => {
    return calculateTriageRisk(symptoms, parsedVitals);
  }, [symptoms, parsedVitals]);

  function addSymptom(value: string) {
    const trimmed = value.trim();
    if (trimmed && !symptoms.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSymptoms([...symptoms, trimmed]);
      setSymptomInput("");
    }
  }

  function step(key: VitalFieldConfig["key"], delta: number) {
    setVitals((prev) => {
      const current = parseFloat(prev[key]) || 0;
      const config = VITAL_FIELDS.find((f) => f.key === key);
      const increment = config?.step ?? 1;
      const next = Math.max(0, current + delta * increment);
      return { ...prev, [key]: (config?.step ? next.toFixed(1) : Math.round(next)).toString() };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = calculateTriageRisk(symptoms, parsedVitals);

      const validCareEpisodeId = uuidValidate(careEpisodeId) ? careEpisodeId : uuidv4();

      const assessment = TriageAssessmentSchema.parse({
        id: uuidv4(),
        careEpisodeId: validCareEpisodeId,
        symptoms,
        vitals: parsedVitals,
        clinicalRiskLevel: result.level,
        notes: notes || undefined,
        performedBy: workerId,
        performedAt: new Date().toISOString(),
        syncStatus: "pending",
      });

      await writeAndQueue(db.triageAssessments, "triage", assessment);

      setTriageResult(result);
      onSubmitted(result.level, assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save triage record");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-extrabold text-primary tracking-tight">
          Digital Triage Assessment
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Frontline clinical decision support with automated vitals threshold evaluation and risk categorization.
        </p>
      </div>

      {/* REAL-TIME DYNAMIC EMERGENCY WARNING BANNER (Only when current inputs indicate an emergency) */}
      {liveRisk.isEmergency && !triageResult && (
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 shadow-sm animate-pulse transition-all">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
              <span className="material-symbols-outlined text-2xl">emergency</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Real-Time Red Alert
                </span>
                <span className="text-xs font-bold text-red-900">Immediate Clinical Attention Required</span>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-red-800">
                {liveRisk.explanation}
              </p>
              <p className="mt-1 text-xs text-red-700 font-medium">
                Action: {liveRisk.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPUTED RESULT PANEL (Immediately visible after saving) */}
      {triageResult && (
        <div
          role="region"
          aria-label="Triage Assessment Result"
          className={`rounded-3xl border-2 p-6 shadow-md transition-all ${
            triageResult.tier === "RED"
              ? "border-red-500 bg-red-50/90 text-red-950"
              : triageResult.tier === "YELLOW"
              ? "border-amber-500 bg-amber-50/90 text-amber-950"
              : "border-emerald-500 bg-emerald-50/90 text-emerald-950"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                  triageResult.tier === "RED"
                    ? "bg-red-600"
                    : triageResult.tier === "YELLOW"
                    ? "bg-amber-600"
                    : "bg-emerald-600"
                }`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {triageResult.tier === "RED" ? "warning" : triageResult.tier === "YELLOW" ? "priority_high" : "check_circle"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider text-white ${
                      triageResult.tier === "RED"
                        ? "bg-red-700"
                        : triageResult.tier === "YELLOW"
                        ? "bg-amber-700"
                        : "bg-emerald-700"
                    }`}
                  >
                    TRIAGE {triageResult.tier}
                  </span>
                  <span className="text-xs font-bold opacity-80">
                    Calculated Score: {triageResult.score} pts
                  </span>
                </div>
                <h3 className="mt-1 text-xl font-extrabold">
                  {triageResult.tier === "RED"
                    ? "Emergency — Refer Immediately"
                    : triageResult.tier === "YELLOW"
                    ? "High Priority — Refer Within 24h"
                    : "Routine — Monitor & Routine Follow-up"}
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-sm text-emerald-700">cloud_done</span>
                <span>Saved to Local DB</span>
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-75">Clinical Finding</p>
              <p className="text-sm font-semibold leading-relaxed mt-0.5">
                {triageResult.explanation}
              </p>
            </div>

            {triageResult.triggers.length > 0 && (
              <div className="rounded-xl bg-white/80 p-3 border border-black/5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Identified Risk Indicators
                </p>
                <ul className="space-y-1 text-xs font-medium">
                  {triageResult.triggers.map((trig, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm shrink-0 opacity-80">check</span>
                      <span>{trig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider opacity-75">Recommended Next Action</p>
              <p className="text-sm font-bold mt-0.5">
                {triageResult.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. SYMPTOM ENTRY */}
        <section className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary">
              1. Symptom Entry
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">
              Select symptoms to calculate severity
            </span>
          </div>

          <div className="relative mb-3">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg">
              search
            </span>
            <input
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest font-body-md text-sm placeholder:text-on-surface-variant"
              placeholder="Search or type a symptom and press Enter..."
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSymptom(symptomInput);
                }
              }}
            />
          </div>

          {/* Active Symptoms Badges */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
              <span className="text-xs font-bold text-primary self-center mr-1">Selected:</span>
              {symptoms.map((s) => {
                const sLower = s.toLowerCase();
                let weight = 1;
                for (const [k, w] of Object.entries(SYMPTOM_WEIGHTS)) {
                  if (sLower.includes(k)) weight = Math.max(weight, w);
                }
                const isHigh = weight >= 3;
                return (
                  <div
                    key={s}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isHigh
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    <span>{s}</span>
                    <span className="opacity-75 text-[10px]">+{weight}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${s}`}
                      className="flex items-center justify-center rounded-full hover:bg-black/10 p-0.5 ml-0.5"
                      onClick={() => setSymptoms(symptoms.filter((x) => x !== s))}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* QUICK-SELECT CHIPS WITH DEFINED WEIGHTS */}
          <div>
            <span className="text-xs font-bold text-on-surface-variant mb-2 block">
              Quick Select Weighted Symptoms:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SELECT_SYMPTOMS.map((item) => {
                const isSelected = symptoms.some((s) => s.toLowerCase() === item.name.toLowerCase());
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSymptoms(symptoms.filter((s) => s.toLowerCase() !== item.name.toLowerCase()));
                      } else {
                        addSymptom(item.name);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary shadow-xs"
                        : item.weight >= 4
                        ? "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                        : item.weight >= 3
                        ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                        : "bg-surface-container border-outline-variant text-on-surface hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : item.weight >= 4
                          ? "bg-red-200 text-red-900"
                          : item.weight >= 3
                          ? "bg-amber-200 text-amber-900"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. CLINICAL VITALS */}
        <section className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary">
              2. Vital Signs Measurements
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">
              Vitals thresholds drive automatic risk calculation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VITAL_FIELDS.map((field) => {
              const val = parseFloat(vitals[field.key]) || 0;
              let hasAlert = false;
              if (field.key === "spo2" && val > 0 && val < 92) hasAlert = true;
              if (field.key === "systolicBP" && val > 0 && (val < 90 || val > 160)) hasAlert = true;

              return (
                <div
                  key={field.key}
                  className={`p-3 rounded-xl border transition ${
                    hasAlert ? "bg-red-50/60 border-red-300" : "bg-surface-container-lowest border-outline-variant/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-on-surface">
                      {field.label}
                    </label>
                    <span className="text-[10px] text-on-surface-variant font-semibold">
                      Normal: {field.normalRange}
                    </span>
                  </div>

                  <div className="flex items-center bg-white border border-outline-variant rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => step(field.key, -1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 border-r border-outline-variant text-slate-700 active:scale-95 transition"
                      aria-label={`Decrease ${field.label}`}
                    >
                      <span className="material-symbols-outlined text-lg">remove</span>
                    </button>
                    <input
                      className="flex-1 h-10 text-center font-bold text-sm bg-transparent border-none focus:ring-0 text-on-surface"
                      type="number"
                      step={field.step ?? 1}
                      placeholder="--"
                      value={vitals[field.key]}
                      onChange={(e) => setVitals({ ...vitals, [field.key]: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => step(field.key, 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 border-l border-outline-variant text-slate-700 active:scale-95 transition"
                      aria-label={`Increase ${field.label}`}
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-right text-on-surface-variant font-medium">
                    Unit: {field.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. NOTES */}
        <section className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setNotesOpen((o) => !o)}
            className="flex items-center justify-between w-full p-4 hover:bg-slate-50 transition"
          >
            <span className="font-bold text-sm uppercase tracking-wider text-primary">
              3. Clinical Observations & Notes
            </span>
            <span
              className={`material-symbols-outlined text-on-surface-variant transition-transform ${
                notesOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>
          {notesOpen && (
            <div className="p-4 pt-0 border-t border-outline-variant/60">
              <textarea
                className="w-full mt-2 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface font-body-md text-sm placeholder:text-on-surface-variant p-3"
                placeholder="Document pertinent history, patient appearance, or clinical context..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={submitting || (symptoms.length === 0 && !vitals.spo2 && !vitals.systolicBP)}
          className="w-full min-h-[50px] bg-primary text-on-primary rounded-full font-bold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-xl">
            {submitting ? "hourglass_top" : "check_circle"}
          </span>
          <span>{submitting ? "Computing Clinical Triage..." : "Save Triage Assessment"}</span>
        </button>
      </form>
    </div>
  );
}
