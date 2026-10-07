# 03. System Architecture — Medexa

## High-Level System Architecture

Medexa implements a decoupled, modern multi-tier architecture with offline-first synchronization capabilities.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND TIER (PWA)                                  │
│  React + TypeScript + Vite + Zustand + TailwindCSS                                      │
│                                                                                        │
│  ┌───────────────────────┐   ┌─────────────────────────┐   ┌────────────────────────┐ │
│  │   UI Presentation     │   │   Auth & Session Store  │   │  Referral & Data Store │ │
│  │  (ASHA / Block / Dist)│   │   (Zustand Auth Store)  │   │  (Zustand / Dexie UI)  │ │
│  └───────────────────────┘   └─────────────────────────┘   └────────────────────────┘ │
│              │                            │                             │              │
│              ▼                            ▼                             ▼              │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                       LOCAL PERSISTENCE & SYNC ENGINE                            │  │
│  │  IndexedDB (Dexie.js) Local Cache ──> Offline Sync Queue (pushOne / runSync)      │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / REST API (JWT Authorization)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  BACKEND TIER (FastAPI)                                │
│  Python 3.11 + Pydantic v2 + SQLAlchemy 2.0 Async ORM                                 │
│                                                                                        │
│  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ /auth & /me      │  │ /patients &     │  │ /triage         │  │ /referrals &     │  │
│  │ (Auth & RBAC)    │  │ /care-episodes  │  │ (Clinical Risk) │  │ /transition      │  │
│  └──────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ /facilities      │  │ /continuity     │  │ /dashboard      │  │ SLA Engine &     │  │
│  │ (Reference DB)   │  │ (Follow-ups)    │  │ (Aggregations)  │  │ State Machine    │  │
│  └──────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Asyncpg Connection Pool
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                DATABASE TIER (PostgreSQL)                              │
│  PostgreSQL 15 Database (Schema Managed via Alembic Migrations)                       │
│  Tables: users, facilities, patients, care_episodes, triage_assessments,               │
│          referrals, referral_state_transitions, referral_slas, follow_up_tasks,        │
│          back_referrals, referral_rescue_actions, facility_services, locations         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript | UI component structure & runtime type safety |
| **Build Tooling** | Vite 6 | Fast HMR development server & production bundler |
| **Local Cache & Queue** | Dexie.js (IndexedDB) | Offline local storage and sync transaction queue |
| **State Management** | Zustand | Application presentation state & user session storage |
| **Backend Framework** | FastAPI (Python 3.11) | Async REST API endpoints & OpenAPI documentation |
| **Data Validation** | Pydantic v2 | Strict request/response payload validation & schemas |
| **ORM / Data Access** | SQLAlchemy 2.0 (AsyncIO) | Asynchronous database object mapping & queries |
| **Database Engine** | PostgreSQL 15 | Relational data persistence & foreign key integrity |
| **Schema Migrations** | Alembic | Version-controlled DDL database migrations |
| **Security & Auth** | JWT (PyJWT + Passlib) | Stateless bearer token authentication & RBAC |

---

## Key Data Flow Paths

### 1. Online Operational Flow
1. User authenticates via `POST /api/auth/login`.
2. Backend returns JWT token; stored in `localStorage["auth_token"]`.
3. Operational actions (e.g. `POST /api/referrals`) include `Authorization: Bearer <JWT>`.
4. FastAPI validates payload against Pydantic schema, enforces state machine rules, and commits to PostgreSQL.

### 2. Offline Operational Flow
1. Frontline worker creates a record (Patient, Triage, or Referral) while disconnected.
2. Record is written immediately to IndexedDB via `writeAndQueue(db.table, entityName, payload)`.
3. Record receives `syncStatus: "pending"` and is entered into `db.syncQueue`.
4. UI displays optimistic local state with "Offline — N records pending" badge.
5. On network restoration, `runSync()` processes queue items sequentially (`pushOne`) against FastAPI endpoints.
6. Upon successful HTTP 200/201 response, `db.syncQueue` item is deleted and local record is marked `syncStatus: "synced"`.
