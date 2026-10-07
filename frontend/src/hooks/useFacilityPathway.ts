import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";

export type AvailabilityLevel = "available" | "limited" | "unavailable";

export interface FacilityPathwayOption {
  facilityId: string;
  facilityName: string;
  distanceKm: number;
  serviceAvailability: AvailabilityLevel;
  diagnosticAvailability: AvailabilityLevel;
  medicineAvailability: AvailabilityLevel;
}

/**
 * Backed by a seeded/static dataset on the backend (Build Guide Section
 * 6 explicitly scopes this to visibility, not live inventory management).
 * Falls back to a cached response via the PWA's NetworkFirst strategy
 * (vite.config.ts) if offline, so this still works mid-triage without
 * connectivity as long as it was fetched once before.
 */
const FALLBACK_FACILITY_OPTIONS: FacilityPathwayOption[] = [
  {
    facilityId: "FAC-WB-PHC-01",
    facilityName: "Belur Block PHC",
    distanceKm: 3.2,
    serviceAvailability: "available",
    diagnosticAvailability: "available",
    medicineAvailability: "available",
  },
  {
    facilityId: "FAC-WB-CHC-02",
    facilityName: "Joypur Block CHC",
    distanceKm: 8.5,
    serviceAvailability: "available",
    diagnosticAvailability: "available",
    medicineAvailability: "limited",
  },
  {
    facilityId: "FAC-WB-RH-03",
    facilityName: "Sonamukhi Rural Hospital (Block CHC)",
    distanceKm: 14.1,
    serviceAvailability: "available",
    diagnosticAvailability: "limited",
    medicineAvailability: "available",
  },
  {
    facilityId: "FAC-WB-DH-04",
    facilityName: "Bankura District General Hospital",
    distanceKm: 28.7,
    serviceAvailability: "available",
    diagnosticAvailability: "available",
    medicineAvailability: "available",
  },
];

export function useFacilityPathwayOptions(
  fromFacilityId: string
): FacilityPathwayOption[] {
  const [options, setOptions] = useState<FacilityPathwayOption[]>(FALLBACK_FACILITY_OPTIONS);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<FacilityPathwayOption[]>(`/facilities/${fromFacilityId}/pathway-options`)
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setOptions(data);
        }
      })
      .catch(() => {
        if (!cancelled) setOptions(FALLBACK_FACILITY_OPTIONS);
      });

    return () => {
      cancelled = true;
    };
  }, [fromFacilityId]);

  return options;
}
