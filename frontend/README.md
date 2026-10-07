# Care Continuity — Frontend

Offline-first React + TypeScript PWA for frontline health workers and
district officials. See the full Build Guide for architectural reasoning —
this README just maps folders to that document.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to FastAPI on :8000
```

Once the backend is running:

```bash
npm run gen:types  # regenerates src/generated/api-types.ts from FastAPI's live OpenAPI schema
```

## Structure

```
src/
├── models/                    Domain model — Section 2 (Care Episode) & Section 3 (referral state machine)
│   ├── careEpisode.ts          Zod schemas = single source of truth for shape + runtime validation
│   └── referralStateMachine.ts Client-side mirror of legal state transitions
│
├── sync/                      Offline-first engine — Section 8 Stage D
│   ├── db.ts                   Dexie (IndexedDB) local database + sync queue
│   └── syncEngine.ts           Pushes queued records to backend on reconnect
│
├── api/
│   └── client.ts               Thin typed fetch wrapper
│
├── generated/
│   └── api-types.ts             AUTO-GENERATED — do not hand-edit, see `npm run gen:types`
│
├── hooks/
│   ├── useSyncStatus.ts         Powers the offline/sync UI indicator
│   ├── useCareEpisode.ts        Live-reads Care Episode data from local Dexie store
│   └── useFacilityPathway.ts    Care-pathway/affordability visibility (Section 6)
│
├── utils/
│   └── continuityRiskEngine.ts  Rule-based Continuity Risk Engine (Section 4) — upgrade path to a
│                                 trained backend model is a drop-in swap, same output shape
│
├── components/
│   ├── common/
│   │   └── SyncIndicator.tsx    The "Offline — N records waiting to sync" UI from the demo script
│   ├── triage/
│   │   └── TriageForm.tsx       Digital triage — works fully offline
│   ├── referral/
│   │   ├── CreateReferralForm.tsx  Referral creation + pathway visibility
│   │   └── ReferralTracker.tsx     The state-machine UI — the hero workflow, made visible
│   └── dashboard/
│       ├── ReferralContinuitySummary.tsx  Section 5 metrics: completion rate, follow-up compliance
│       └── FacilityContinuityTable.tsx    Decision-oriented, per-facility alerting view
│
├── pages/
│   ├── PatientEpisodePage.tsx    Frontline worker flow — this page IS Acts 1–3 of the demo
│   └── DistrictDashboardPage.tsx District officer flow — Acts 4–5
│
├── App.tsx                     Routing shell
├── main.tsx                    Entry point — boots the sync engine once, at startup
└── styles/app.css               Minimal functional styling; sync indicator + state badges matter most
```

## What's intentionally NOT here yet

- **Auth** — `CURRENT_WORKER_ID` is hardcoded in `PatientEpisodePage.tsx` as a placeholder.
  Wire real JWT auth (Build Guide Section 7) before Phase 4.
- **Patient search/selection UI** — `App.tsx`'s home route is a placeholder; build this once
  Phase 2 (Care Episode core, backend) exists to search against.
- **Full 11-state referral machine** — `referralStateMachine.ts` already includes all states
  per the Build Guide, but wire up the CORE happy-path states first (Phase 4) and only
  exercise the exceptional states once that's proven solid end-to-end, including sync
  (Build Guide Section 9 — sequencing, not scope reduction).
- **Trained-model risk scoring** — `continuityRiskEngine.ts` is deliberately rule-based.
  The function signature is designed so a backend call can replace it later without
  touching any component that uses it.

## The one thing to protect above all else

`sync/db.ts` and `sync/syncEngine.ts` are the highest-stakes code in this repo. Every other
bug is recoverable; a bug here can silently lose a patient record. Treat changes to these
two files with extra test coverage and extra review.
