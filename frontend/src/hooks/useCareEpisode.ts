import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/sync/db";
import type { CareEpisode } from "@/models/careEpisode";

/**
 * Reads directly from Dexie (local-first), not from the network. This is
 * why "view cached history" in Build Guide Section 14 Act 2 works with
 * zero spinner and zero error page even fully offline — the UI never
 * awaits a fetch to render, it reads what's already on-device and the
 * sync engine keeps that store current in the background when online.
 */
export function useCareEpisode(careEpisodeId: string | undefined): CareEpisode | undefined {
  return useLiveQuery(
    () => (careEpisodeId ? db.careEpisodes.get(careEpisodeId) : undefined),
    [careEpisodeId]
  );
}

export function usePatientEpisodes(patientId: string | undefined): CareEpisode[] {
  return (
    useLiveQuery(
      () =>
        patientId
          ? db.careEpisodes.where("patientId").equals(patientId).sortBy("openedAt")
          : [],
      [patientId]
    ) ?? []
  );
}
