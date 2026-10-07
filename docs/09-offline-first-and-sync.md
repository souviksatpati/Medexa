# 09. Offline-First & Sync Engine — Medexa

## Design Principles

Medexa's offline-first architecture is designed for zero data loss in intermittent connectivity environments.

```
       OFFLINE MODE                                          ONLINE SYNCHRONIZATION
 ┌───────────────────────┐                                 ┌─────────────────────────┐
 │ Frontline User Action │                                 │ IndexedDB Sync Queue    │
 └───────────┬───────────┘                                 └────────────┬────────────┘
             │                                                          │
             ▼                                                          ▼
 ┌───────────────────────┐                                 ┌─────────────────────────┐
 │ Write to Dexie Local  │                                 │ Sequential pushOne      │
 │ (syncStatus: pending) │                                 │ (FastAPI REST Endpoints)│
 └───────────┬───────────┘                                 └────────────┬────────────┘
             │                                                          │
             ▼                                                          ▼
 ┌───────────────────────┐                                 ┌─────────────────────────┐
 │ Enqueue to syncQueue  │                                 │ On HTTP 200/201:        │
 │ (queuedAt, attempts)  │                                 │ Delete Queue Item &     │
 └───────────────────────┘                                 │ Mark Local Record       │
                                                           │ syncStatus: "synced"    │
                                                           └─────────────────────────┘
```

---

## Technical Component Architecture

### 1. IndexedDB Local Database (`frontend/src/sync/db.ts`)
Dexie.js manages local storage tables:
- `db.patients` (Local patient store)
- `db.careEpisodes` (Local care episode store)
- `db.triageAssessments` (Local triage store)
- `db.referrals` (Local referral store)
- `db.referralTransitions` (Local transition history)
- `db.backReferrals` (Local back-referral packets)
- `db.followUpTasks` (Local follow-up task store)
- `db.syncQueue` (Persistent synchronization queue)

### 2. Transaction Helper (`writeAndQueue`)
Every offline write invokes `writeAndQueue(table, entityName, payload)`:
```ts
export async function writeAndQueue<T extends { id?: string }>(
  table: Dexie.Table<T, string>,
  entity: SyncQueueItem["entity"],
  payload: T
): Promise<void> {
  await db.transaction("rw", [table, db.syncQueue], async () => {
    await table.put(payload);
    await db.syncQueue.add({
      entity,
      entityId: payload.id || uuidv4(),
      payload,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    });
  });
}
```

### 3. Background Sync Process (`frontend/src/sync/syncEngine.ts`)
- `runSync()` monitors `navigator.onLine` and sync queue size.
- Process runs **oldest-queued-first** to maintain causal dependency order (e.g. Patient → Care Episode → Triage → Referral).
- `pushOne(item)` translates Dexie `camelCase` fields to FastAPI Pydantic `snake_case` fields (e.g. vitals mapping and uppercase `clinical_risk_level`).

### 4. Idempotency & Conflict Strategy
- If a record is pushed twice (e.g. network interruption during acknowledgment), FastAPI uses idempotent primary keys (`await db.get(Entity, payload.id)`). If the record exists, the backend returns `200 OK` with the existing entity rather than failing or duplicating records.
- Failed items are retried up to 5 times with exponential backoff before being flagged for user inspection, ensuring no queue item is silently dropped.
