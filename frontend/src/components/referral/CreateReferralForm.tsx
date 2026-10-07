import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ReferralSchema, type Referral } from "@/models/careEpisode";
import { db, writeAndQueue } from "@/sync/db";
import { useFacilityPathwayOptions } from "@/hooks/useFacilityPathway";

interface CreateReferralFormProps {
  careEpisodeId: string;
  patientId: string;
  fromFacilityId: string;
  createdBy: string;
  onCreated: (referral: Referral) => void;
}

const AVAILABILITY_STYLES: Record<string, string> = {
  available: "bg-green-accent/10 text-green-accent",
  limited: "bg-amber-accent/10 text-amber-accent",
  unavailable: "bg-red-accent/10 text-red-accent",
};

/**
 * Care-Pathway Visibility (canonical context Section 11: "facility-aware
 * routing"). NOT a financial/payment module — a lookup surfacing
 * distance + service/diagnostic/medicine availability so the worker
 * routes the patient somewhere appropriate before creating the referral.
 * Styled consistently with the Stitch Triage Form's card system.
 */
export function CreateReferralForm({
  careEpisodeId,
  patientId,
  fromFacilityId,
  createdBy,
  onCreated,
}: CreateReferralFormProps) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pathwayOptions = useFacilityPathwayOptions(fromFacilityId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFacilityId || !reason.trim()) return;
    setSubmitting(true);

    try {
      const referral = ReferralSchema.parse({
        id: uuidv4(),
        careEpisodeId,
        patientId,
        fromFacilityId,
        toFacilityId: selectedFacilityId,
        currentState: "SENT",
        reason,
        createdAt: new Date().toISOString(),
        createdBy,
        history: [],
        rescueActions: [],
        syncStatus: "pending",
      });

      await writeAndQueue(db.referrals, "referral", referral);
      onCreated(referral);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-lg">
      <section className="bg-surface-container-lowest border border-outline-variant rounded p-md shadow-sm">
        <h3 className="font-label-lg text-label-lg text-primary mb-xs">Recommended Facilities</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-md">
          Ranked by appropriateness for this case — distance, service match, and current
          availability, not just proximity.
        </p>

        <div className="space-y-sm">
          {pathwayOptions.map((option) => (
            <label
              key={option.facilityId}
              className={`flex gap-md items-start p-md rounded border cursor-pointer transition-colors ${
                selectedFacilityId === option.facilityId
                  ? "border-primary bg-primary-container/10"
                  : "border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              <input
                type="radio"
                name="facility"
                className="mt-1"
                value={option.facilityId}
                checked={selectedFacilityId === option.facilityId}
                onChange={() => setSelectedFacilityId(option.facilityId)}
              />
              <div className="flex flex-col gap-xs flex-1">
                <strong className="font-label-lg text-label-lg text-on-surface">
                  {option.facilityName}
                </strong>
                <span className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">place</span>
                  {option.distanceKm.toFixed(1)} km away
                </span>
                <div className="flex flex-wrap gap-xs">
                  <span
                    className={`font-label-sm text-label-sm px-sm py-[2px] rounded ${AVAILABILITY_STYLES[option.serviceAvailability]}`}
                  >
                    Service: {option.serviceAvailability}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm px-sm py-[2px] rounded ${AVAILABILITY_STYLES[option.diagnosticAvailability]}`}
                  >
                    Diagnostics: {option.diagnosticAvailability}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm px-sm py-[2px] rounded ${AVAILABILITY_STYLES[option.medicineAvailability]}`}
                  >
                    Medicine: {option.medicineAvailability}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
          Reason for referral
        </label>
        <textarea
          className="w-full rounded border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface font-body-md text-body-md p-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !selectedFacilityId}
        className="w-full h-tap-target-min bg-primary text-on-primary rounded-full font-label-lg text-label-lg hover:bg-surface-tint active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-sm"
      >
        <span className="material-symbols-outlined">send</span>
        {submitting ? "Creating..." : "Create Referral"}
      </button>
    </form>
  );
}
