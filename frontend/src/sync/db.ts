import Dexie, { type Table } from "dexie";
import type {
  Patient,
  CareEpisode,
  TriageAssessment,
  Referral,
  ReferralStateTransition,
  FollowUpTask,
  BackReferral,
} from "@/models/careEpisode";

/**
 * This is where "offline-first" actually lives (Build Guide Section 8,
 * Stage D). Every write in the app goes here FIRST, synchronously,
 * regardless of network state. The SyncQueue table tracks what still
 * needs to be pushed to the backend. Nothing in the UI should ever
 * block on a network call — see sync/syncEngine.ts for the push logic.
 */

export type SyncOperation = "create" | "update";
export type SyncEntity = "patient" | "careEpisode" | "triage" | "referral" | "referralTransition" | "followUpTask" | "backReferral";

export interface SyncQueueItem {
  id?: number; // auto-increment
  entity: SyncEntity;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
  queuedAt: string; // ISO timestamp, device-local clock
  attempts: number;
  lastError?: string;
}

export class CareContinuityDB extends Dexie {
  patients!: Table<Patient, string>;
  careEpisodes!: Table<CareEpisode, string>;
  triageAssessments!: Table<TriageAssessment, string>;
  referrals!: Table<Referral, string>;
  referralTransitions!: Table<ReferralStateTransition, string>;
  followUpTasks!: Table<FollowUpTask, string>;
  backReferrals!: Table<BackReferral, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("care-continuity-db");
    this.version(1).stores({
      patients: "id, fullName, villageOrWard",
      careEpisodes: "id, patientId, status, syncStatus",
      triageAssessments: "id, careEpisodeId, clinicalRiskLevel, syncStatus",
      referrals: "id, careEpisodeId, patientId, currentState, syncStatus",
      referralTransitions: "id, referralId, toState, changedAt",
      followUpTasks: "id, careEpisodeId, referralId, dueAt, status",
      backReferrals: "id, referralId, recordedAt",
      // ++id = auto-increment primary key for the queue itself
      syncQueue: "++id, entity, entityId, queuedAt",
    });
    this.version(2).stores({
      patients: "id, fullName, villageOrWard",
      careEpisodes: "id, patientId, status, syncStatus",
      triageAssessments: "id, careEpisodeId, clinicalRiskLevel, syncStatus",
      referrals: "id, careEpisodeId, patientId, currentState, syncStatus",
      referralTransitions: "id, referralId, toState, changedAt",
      followUpTasks: "id, careEpisodeId, referralId, dueAt, status",
      backReferrals: "id, referralId, recordedAt",
      syncQueue: "++id, entity, entityId, queuedAt",
    });
  }
}

export const db = new CareContinuityDB();

/**
 * Every local write goes through this helper so nothing forgets to
 * enqueue a sync job. This is the discipline that prevents the class of
 * bug where a record is saved locally but silently never reaches the
 * server — see Build Guide Section 12 ("failed sync must never silently
 * drop data").
 */
export async function writeAndQueue<T extends { id: string }>(
  table: Table<T, string>,
  entity: SyncEntity,
  record: T,
  operation: SyncOperation = "create"
): Promise<void> {
  await db.transaction("rw", table, db.syncQueue, async () => {
    await table.put(record);
    await db.syncQueue.add({
      entity,
      entityId: record.id,
      operation,
      payload: record,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    });
  });
}
