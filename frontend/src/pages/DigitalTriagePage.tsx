import { useState } from "react";
import { z } from "zod";
import { Link, useParams, useNavigate } from "react-router-dom";
import { TriageForm } from "@/components/triage/TriageForm";
import {
  TriageAssessmentSchema,
  type ClinicalRiskLevelT,
} from "@/models/careEpisode";
type TriageAssessment = z.infer<typeof TriageAssessmentSchema>;
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { useAuth } from "@/auth/auth";
import { useReferralAuth } from "@/sync/referralAuth";

export interface DigitalTriagePageProps {
  embedded?: boolean;
  careEpisodeId?: string;
  workerId?: string;
  patientData?: {
    id: string;
    name: string;
    ageGender?: string;
  };
  onComplete?: (riskLevel: ClinicalRiskLevelT, assessment?: TriageAssessment) => void;
  onBackToReferral?: () => void;
}

export function DigitalTriagePage({
  embedded = false,
  careEpisodeId: propEpisodeId,
  workerId: propWorkerId,
  patientData,
  onComplete,
  onBackToReferral,
}: DigitalTriagePageProps = {}) {
  const { tPortal, language } = useLanguageStore();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { ashaUser, logoutAsha } = useReferralAuth();
  const currentAsha = ashaUser || (user?.role === "ASHA" ? user : null);

  const handleLogout = () => {
    if (logoutAsha) logoutAsha();
    if (logout) logout();
    navigate("/#portals");
  };

  const params = useParams<{
    careEpisodeId: string;
  }>();

  const episodeId =
    propEpisodeId || params.careEpisodeId || "550e8400-e29b-41d4-a716-446655440002";

  const workerId = propWorkerId || "worker-demo-001";

  // Patient details
  const [patientId, setPatientId] = useState(patientData?.id || "");
  const [patientName, setPatientName] = useState(patientData?.name || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Patient details submitted state
  const [patientSubmitted, setPatientSubmitted] = useState(Boolean(patientData));

  // Validation message
  const [patientError, setPatientError] = useState("");

  const handlePatientSubmit = () => {
    if (
      !patientId.trim() ||
      !patientName.trim() ||
      !age ||
      !gender
    ) {
      setPatientError(
        "Please complete all patient details before continuing.",
      );

      setPatientSubmitted(false);

      return;
    }

    setPatientError("");
    setPatientSubmitted(true);

    // Move the user to the clinical assessment section
    setTimeout(() => {
      document
        .getElementById("clinical-assessment")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  // If embedded directly inside Care Episode (§5.3)
  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-outline-variant bg-surface p-5 sm:p-7 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <span className="material-symbols-outlined text-2xl">stethoscope</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  1. Digital Triage Entry Point
                </span>
                <h3 className="text-lg font-bold text-on-surface">Digital Triage Assessment & Patient Registration</h3>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                Care Episode ID: <span className="font-mono">{episodeId.slice(0, 8)}...</span>
              </span>
              {onBackToReferral && (
                <button
                  type="button"
                  onClick={onBackToReferral}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  <span>{tPortal("backToVillageReferral", "Village Referrals")}</span>
                </button>
              )}
            </div>
          </div>

          <TriageForm
            careEpisodeId={episodeId}
            workerId={workerId}
            onSubmitted={(riskLevel, assessment) => {
              if (onComplete) {
                onComplete(riskLevel, assessment);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-teal-900 bg-teal-800 shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">

          <Link
            to="/"
            className="flex items-center gap-3 text-white"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <span className="material-symbols-outlined text-[24px]">
                medical_services
              </span>
            </div>

            <div>

              <div className="text-xl font-bold tracking-tight">
                Medexa
              </div>

              <div className="text-xs text-teal-100">
                {tPortal("digitalTriage", "Digital Triage", language)}
              </div>

            </div>

          </Link>

          {/* ASHA Credentials and Controls in Standalone Header */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/referrals/asha?view=referral"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">{tPortal("backToVillageReferral", "Back to Village Referral")}</span>
            </Link>

            {currentAsha && (
              <div className="hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
                <span className="font-bold">{currentAsha.name}</span>
                <span className="text-[10px] text-teal-200">({currentAsha.id})</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-rose-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600 transition"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-xs">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>

            <LanguageSelector />
          </div>
        </div>
      </header>


      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-6xl px-5 py-8 pb-32 md:px-8 md:py-10 md:pb-12">

        {/* ================= BREADCRUMB ================= */}
        <div className="mb-7 flex flex-wrap items-center gap-2 text-sm">

          <Link
            to="/"
            className="font-medium text-slate-500 hover:text-teal-700"
          >
            Medexa
          </Link>

          <span className="material-symbols-outlined text-[17px] text-slate-400">
            chevron_right
          </span>

          <span className="font-medium text-slate-600">
            Clinical Assessment
          </span>

          <span className="material-symbols-outlined text-[17px] text-slate-400">
            chevron_right
          </span>

          <span className="font-semibold text-teal-700">
            Digital Triage
          </span>

        </div>


        {/* ================= PAGE TITLE ================= */}
        <section className="mb-8">

          <div className="rounded-3xl bg-teal-900 p-7 text-white shadow-lg md:p-9">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-teal-50">

                  <span className="material-symbols-outlined text-[19px]">
                    clinical_notes
                  </span>

                  Clinical Assessment

                </div>


                <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                  Digital Triage
                </h1>


                <p className="mt-3 max-w-2xl text-base leading-7 text-teal-100 md:text-lg">
                  Assess the patient's symptoms and vital signs to determine
                  the appropriate level of clinical attention.
                </p>

              </div>


              {/* Assessment ID */}
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">

                <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                  Assessment ID
                </p>

                <p className="mt-2 max-w-[230px] break-all font-mono text-sm font-semibold text-white">
                  {episodeId}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ================= PROGRESS ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Assessment Workflow
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Clinical evaluation
              </h2>

            </div>


            <div
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                patientSubmitted
                  ? "bg-green-100 text-green-800"
                  : "bg-teal-100 text-teal-800"
              }`}
            >
              {patientSubmitted ? "Step 2 of 4" : "Step 1 of 4"}
            </div>

          </div>


          <div className="grid gap-3 sm:grid-cols-4">

            {/* Patient */}
            <div
              className={`rounded-xl p-3 ${
                patientSubmitted
                  ? "bg-green-600 text-white"
                  : "bg-teal-700 text-white"
              }`}
            >

              <div className="flex items-center gap-2">

                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {patientSubmitted ? "✓" : "1"}
                </div>

                <span className="text-sm font-semibold">
                  Patient
                </span>

              </div>

            </div>


            {/* Symptoms */}
            <div
              className={`rounded-xl p-3 ${
                patientSubmitted
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >

              <div className="flex items-center gap-2">

                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-sm font-bold">
                  2
                </div>

                <span className="text-sm font-semibold">
                  Symptoms
                </span>

              </div>

            </div>


            {/* Vital Signs */}
            <div className="rounded-xl bg-slate-100 p-3 text-slate-500">

              <div className="flex items-center gap-2">

                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-sm font-bold">
                  3
                </div>

                <span className="text-sm font-semibold">
                  Vital Signs
                </span>

              </div>

            </div>


            {/* Risk */}
            <div className="rounded-xl bg-slate-100 p-3 text-slate-500">

              <div className="flex items-center gap-2">

                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-sm font-bold">
                  4
                </div>

                <span className="text-sm font-semibold">
                  Risk
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* ================= PATIENT DETAILS ================= */}
        <section className="mb-7 overflow-hidden rounded-3xl border border-blue-200 bg-blue-50 shadow-sm">

          {/* Section Header */}
          <div className="border-b border-blue-200 bg-blue-100 px-6 py-5">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">

                <span className="material-symbols-outlined">
                  person
                </span>

              </div>


              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Step 1
                </p>

                <h2 className="text-xl font-bold text-blue-950">
                  Patient Details
                </h2>

                <p className="mt-1 text-sm text-blue-800">
                  Enter the patient's basic information before starting the assessment.
                </p>

              </div>

            </div>

          </div>


          {/* Input Fields */}
          <div className="grid gap-5 p-6 md:grid-cols-2">

            {/* Patient ID */}
            <div>

              <label
                htmlFor="patientId"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Patient ID
              </label>

              <input
                id="patientId"
                type="text"
                value={patientId}
                onChange={(event) => {
                  setPatientId(event.target.value);
                  setPatientError("");
                  setPatientSubmitted(false);
                }}
                placeholder="Enter patient ID"
                className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />

            </div>


            {/* Patient Name */}
            <div>

              <label
                htmlFor="patientName"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Patient Name
              </label>

              <input
                id="patientName"
                type="text"
                value={patientName}
                onChange={(event) => {
                  setPatientName(event.target.value);
                  setPatientError("");
                  setPatientSubmitted(false);
                }}
                placeholder="Enter patient's full name"
                className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />

            </div>


            {/* Age */}
            <div>

              <label
                htmlFor="age"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Age
              </label>

              <input
                id="age"
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(event) => {
                  setAge(event.target.value);
                  setPatientError("");
                  setPatientSubmitted(false);
                }}
                placeholder="Enter age"
                className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />

            </div>


            {/* Gender */}
            <div>

              <label
                htmlFor="gender"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Gender
              </label>

              <select
                id="gender"
                value={gender}
                onChange={(event) => {
                  setGender(event.target.value);
                  setPatientError("");
                  setPatientSubmitted(false);
                }}
                className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              >

                <option value="">
                  Select gender
                </option>

                <option value="male">
                  Male
                </option>

                <option value="female">
                  Female
                </option>

                <option value="other">
                  Other
                </option>

                <option value="prefer-not-to-say">
                  Prefer not to say
                </option>

              </select>

            </div>

          </div>


          {/* Validation Error */}
          {patientError && (
            <div className="mx-6 mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3">

              <div className="flex items-center gap-3">

                <span className="material-symbols-outlined text-red-600">
                  error
                </span>

                <p className="text-sm font-semibold text-red-800">
                  {patientError}
                </p>

              </div>

            </div>
          )}


          {/* Success Message */}
          {patientSubmitted && (
            <div className="mx-6 mb-5 rounded-xl border border-green-300 bg-green-50 px-4 py-3">

              <div className="flex items-center gap-3">

                <span className="material-symbols-outlined text-green-600">
                  check_circle
                </span>

                <p className="text-sm font-semibold text-green-800">
                  Patient details submitted successfully. Continue with the clinical assessment below.
                </p>

              </div>

            </div>
          )}


          {/* Submit Patient Details */}
          <div className="border-t border-blue-200 bg-blue-100/70 px-6 py-5">

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <p className="text-sm font-bold text-blue-950">
                  Patient information ready?
                </p>

                <p className="mt-1 text-xs text-blue-800">
                  Submit the details to continue with the clinical assessment.
                </p>

              </div>


              <button
                type="button"
                onClick={handlePatientSubmit}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-7 py-3 font-bold text-white shadow-sm transition hover:bg-blue-800 sm:w-auto"
              >

                <span className="material-symbols-outlined">
                  check_circle
                </span>

                {patientSubmitted
                  ? "Patient Details Submitted"
                  : "Submit Patient Details"}

                <span className="material-symbols-outlined text-[20px]">
                  arrow_downward
                </span>

              </button>

            </div>

          </div>

        </section>


        {/* ================= TRIAGE FORM ================= */}
        <section
          id="clinical-assessment"
          className="overflow-hidden rounded-3xl border border-teal-200 bg-white shadow-sm"
        >
          {/* Section Header */}
          <div className="border-b border-teal-100 bg-teal-50/80 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
                <span className="material-symbols-outlined">
                  stethoscope
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Frontline Clinical Decision Support
                </p>
                <h2 className="text-xl font-bold text-teal-950">
                  Clinical Assessment & Vitals
                </h2>
                <p className="mt-1 text-sm text-teal-800">
                  Live risk scoring evaluates symptoms and vital indicators in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Functional Triage Form */}
          <div className="p-5 md:p-7">
            <TriageForm
              careEpisodeId={episodeId}
              workerId={workerId}
              onSubmitted={(riskLevel, assessment) => {
                if (onComplete) {
                  onComplete(riskLevel, assessment);
                }
              }}
            />
          </div>
        </section>

      </main>


      {/* ================= NAVIGATION BUTTONS ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">

        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row md:px-8">

          {/* Main Page */}
          <Link
            to="/"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-teal-800 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-teal-900 sm:w-auto"
          >

            <span className="material-symbols-outlined">
              home
            </span>

            Main Page

          </Link>


          {/* Back to Patient Episode */}
          <Link
            to={`/episode/${episodeId}`}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-teal-700 bg-white px-6 py-3 font-bold text-teal-800 transition hover:bg-teal-50 sm:w-auto"
          >

            <span className="material-symbols-outlined">
              arrow_back
            </span>

            Back to Patient Episode

          </Link>

        </div>

      </div>

    </div>
  );
}
