import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCareEpisode } from "@/hooks/useCareEpisode";
import { TriageForm } from "@/components/triage/TriageForm";
import { CreateReferralForm } from "@/components/referral/CreateReferralForm";
import { ReferralTracker } from "@/components/referral/ReferralTracker";
import { SyncIndicator } from "@/components/common/SyncIndicator";
import { BrandMark } from "@/components/common/BrandMark";
import { db } from "@/sync/db";

import type {
  ClinicalRiskLevelT,
  Referral,
  Patient,
} from "@/models/careEpisode";

const CURRENT_WORKER_ID = "worker-demo-001";

export function PatientEpisodePage() {
  const { careEpisodeId } = useParams<{ careEpisodeId: string }>();
  const episode = useCareEpisode(careEpisodeId);

  const [patient, setPatient] = useState<Patient | null>(null);

  const [latestClinicalRisk, setLatestClinicalRisk] =
    useState<ClinicalRiskLevelT | null>(null);

  const [createdReferral, setCreatedReferral] =
    useState<Referral | null>(null);

  const activeReferral = createdReferral ?? episode?.referral ?? null;

  // Load patient information from IndexedDB
  useEffect(() => {
    if (!episode?.patientId) return;

    db.patients.get(episode.patientId).then((result) => {
      setPatient(result ?? null);
    });
  }, [episode?.patientId]);

  if (!episode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary animate-pulse">
              sync
            </span>

            <div>
              <p className="font-semibold text-on-surface">
                Loading patient record
              </p>

              <p className="text-sm text-on-surface-variant mt-1">
                Retrieving the care episode from local storage...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showReferralPrompt =
    (latestClinicalRisk === "high" ||
      latestClinicalRisk === "emergency") &&
    !activeReferral;

  return (
    <div className="min-h-screen bg-background text-on-background pb-20">

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">

          <BrandMark />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-surface-container px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-green-accent" />

              <span className="text-sm font-medium text-on-surface-variant">
                Care session active
              </span>
            </div>

            <SyncIndicator />
          </div>

        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">

        {/* Page Header */}
        <section className="mb-8">

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  clinical_notes
                </span>

                Patient Care
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
                Care Episode
              </h1>

              <p className="mt-2 text-sm text-on-surface-variant">
                Review the patient, complete the clinical assessment, and
                coordinate the next step in care.
              </p>

            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-outline-variant bg-surface px-4 py-2">

              <span className="h-2.5 w-2.5 rounded-full bg-green-accent" />

              <span className="text-sm font-semibold text-on-surface">
                Active
              </span>

            </div>

          </div>

        </section>

        {/* Patient Information */}
        <section className="mb-8 rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-ambient">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-primary">

              <span className="material-symbols-outlined filled">
                person
              </span>

            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Patient
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-on-surface">
                    {patient?.fullName ?? "Loading patient..."}
                  </h2>
                </div>

                <span className="mt-2 self-start rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant sm:mt-0">
                  Episode #{episode.id.slice(0, 8)}
                </span>

              </div>

              {/* Patient Details */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <InfoItem
                  icon="badge"
                  label="Patient ID"
                  value={episode.patientId}
                />

                <InfoItem
                  icon="medical_information"
                  label="Care Episode"
                  value={episode.id}
                />

                <InfoItem
                  icon="person"
                  label="Age"
                  value={
                    patient
                      ? `${patient.age} years`
                      : "Loading..."
                  }
                />

                <InfoItem
                  icon="wc"
                  label="Sex"
                  value={patient?.sex ?? "Loading..."}
                />

                <InfoItem
                  icon="location_on"
                  label="Village / Ward"
                  value={patient?.villageOrWard ?? "Loading..."}
                />

                <InfoItem
                  icon="phone"
                  label="Phone"
                  value={patient?.phone ?? "Loading..."}
                />

                <InfoItem
                  icon="medical_services"
                  label="Chronic Condition"
                  value={
                    patient?.chronicConditions?.length
                      ? patient.chronicConditions.join(", ")
                      : "None"
                  }
                />

              </div>

            </div>

          </div>

        </section>

        {/* Care Journey */}
        <section className="mb-8 rounded-3xl border border-outline-variant bg-surface p-6 shadow-ambient">

          <div className="mb-5">

            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Care journey
            </p>

            <h2 className="mt-1 text-lg font-bold text-on-surface">
              From assessment to continuity
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

            <JourneyStep
              icon="clinical_notes"
              title="Assessment"
              active
            />

            <JourneyStep
              icon="alt_route"
              title="Referral"
              active={Boolean(activeReferral)}
            />

            <JourneyStep
              icon="event_repeat"
              title="Follow-up"
              active={false}
            />

            <JourneyStep
              icon="check_circle"
              title="Completed"
              active={false}
            />

          </div>

        </section>

        {/* Clinical Assessment */}
        <section className="mb-8">

          <div className="mb-4">

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-primary">

                <span className="material-symbols-outlined">
                  clinical_notes
                </span>

              </div>

              <div>

                <h2 className="text-xl font-bold text-on-surface">
                  Clinical Assessment
                </h2>

                <p className="text-sm text-on-surface-variant">
                  Complete the digital triage assessment below.
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient md:p-7">

            <TriageForm
              careEpisodeId={episode.id}
              workerId={CURRENT_WORKER_ID}
              onSubmitted={(riskLevel) =>
                setLatestClinicalRisk(riskLevel)
              }
            />

          </div>

        </section>

        {/* Referral */}
        {showReferralPrompt && (
          <section className="mb-8">

            <div className="mb-4">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-accent/10 text-amber-accent">

                  <span className="material-symbols-outlined">
                    warning
                  </span>

                </div>

                <div>

                  <h2 className="text-xl font-bold text-on-surface">
                    Referral Recommended
                  </h2>

                  <p className="text-sm text-on-surface-variant">
                    The assessment indicates that the patient may require
                    additional care.
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-amber-accent/30 bg-surface-container-lowest p-5 shadow-ambient md:p-7">

              <CreateReferralForm
                careEpisodeId={episode.id}
                patientId={episode.patientId}
                fromFacilityId="facility-subcentre-demo"
                createdBy={CURRENT_WORKER_ID}
                onCreated={(referral) =>
                  setCreatedReferral(referral)
                }
              />

            </div>

          </section>
        )}

        {/* Referral Tracker */}
        {activeReferral && (
          <section>

            <div className="mb-4">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-primary">

                  <span className="material-symbols-outlined">
                    timeline
                  </span>

                </div>

                <div>

                  <h2 className="text-xl font-bold text-on-surface">
                    Referral Tracking
                  </h2>

                  <p className="text-sm text-on-surface-variant">
                    Follow the patient's care journey after referral.
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient md:p-7">

              <ReferralTracker
                referral={activeReferral}
                changedBy={CURRENT_WORKER_ID}
              />

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

/* -------------------------------------------------------
   Small reusable UI components
------------------------------------------------------- */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-container px-4 py-3">

      <span className="material-symbols-outlined text-primary">
        {icon}
      </span>

      <div className="min-w-0">

        <p className="text-xs font-medium text-on-surface-variant">
          {label}
        </p>

        <p className="truncate text-sm font-semibold text-on-surface">
          {value}
        </p>

      </div>

    </div>
  );
}

function JourneyStep({
  icon,
  title,
  active = false,
}: {
  icon: string;
  title: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
        active
          ? "border-primary/30 bg-primary-container/20"
          : "border-outline-variant bg-surface-container-low"
      }`}
    >

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-primary text-on-primary"
            : "bg-surface-container-high text-on-surface-variant"
        }`}
      >

        <span className="material-symbols-outlined text-[20px]">
          {icon}
        </span>

      </div>

      <div className="min-w-0">

        <p
          className={`text-sm font-semibold ${
            active
              ? "text-primary"
              : "text-on-surface-variant"
          }`}
        >
          {title}
        </p>

        <p className="text-xs text-on-surface-variant">
          {active ? "Current" : "Pending"}
        </p>

      </div>

    </div>
  );
}
