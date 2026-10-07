# Medexa — Integrated Care Continuity & Referral Tracking Platform

> **Smart Care Continuity for Rural and Underserved Healthcare**  
> Problem Statement ID: **SIH26133** | Smart India Hackathon 2026

Medexa is an **offline-first healthcare care-continuity and referral-tracking platform** designed for frontline health workers (ASHAs), Block Medical Officers, and District Health Officials. It eliminates referral loss, monitors SLAs, escalates delayed care, and guarantees post-discharge home follow-up across rural public health networks.

---

## Key Capabilities

- **Single Immutable Patient Identity**: Permanent UUID assignment (`patient_id` & `care_episode_id`) across all care tiers.
- **Offline-First Frontline Intake**: Frontline registration, digital triage, and referral creation operate fully offline using IndexedDB (Dexie.js) with background synchronization.
- **Enforced 11-State Referral State Machine**: Strict business rules (`DRAFT` → `SENT` → `RECEIVED` → `ACCEPTED` → `ARRIVED` → `CONSULTED` → `REFERRED_BACK` → `FOLLOW_UP_DUE` → `FOLLOW_UP_COMPLETED` → `CLOSED`).
- **SLA Monitoring & Rescue Actions**: Automated tracking of acknowledgment and consultation deadlines with supervisor alert escalations.
- **Structured Back-Referral Packet**: Post-treatment instructions, prescribed medication, and automated 48-72h home visit follow-up tasks.
- **Real-time District Oversight & Analytics**: Dashboard metrics computed from real database records (completion rates, referral delays, compliance).

---

## Technical Stack

- **Frontend**: React 18, TypeScript, Vite 6, Dexie.js (IndexedDB), Zustand, TailwindCSS, PWA.
- **Backend**: FastAPI (Python 3.11), Pydantic v2, SQLAlchemy 2.0 AsyncIO, Alembic, PyJWT.
- **Database**: PostgreSQL 15 (relational persistence & foreign key constraints).

---

## Repository Structure

```
Medexa/
├── docs/                                  # Canonical technical documentation suite
│   ├── README.md                          # Documentation index
│   ├── 01-overview.md                     # Product overview & problem context
│   ├── 03-system-architecture.md          # Multi-tier system architecture
│   ├── 04-domain-model.md                 # Entity relationships & Single Patient Identity
│   ├── 05-care-continuity-workflow.md     # Step-by-step 10-stage care journey
│   ├── 09-offline-first-and-sync.md       # Dexie local cache & offline sync engine
│   ├── 10-authentication-and-rbac.md      # JWT authentication & RBAC matrix
│   ├── 13-dataset-and-geography.md        # Synthetic care scenarios & pilot geography
│   ├── 15-testing-and-validation.md       # Automated verification & test suite
│   └── 17-troubleshooting.md              # Diagnostics & troubleshooting guide
├── frontend/                              # React + TypeScript PWA application
│   ├── src/
│   │   ├── api/                           # API client layer & referral API
│   │   ├── auth/                          # Authentication store & RBAC rules
│   │   ├── components/                    # UI components (Triage, Referral, Dashboard)
│   │   ├── models/                        # Zod domain schemas & state machine
│   │   ├── pages/                         # Role-scoped portal views (ASHA, Block, District)
│   │   └── sync/                          # Dexie storage & background sync engine
├── backend/                               # FastAPI backend application
│   ├── app/
│   │   ├── core/                          # Database connection & JWT security
│   │   ├── models/                        # SQLAlchemy database models
│   │   ├── routers/                       # REST API endpoint routers
│   │   ├── schemas/                       # Pydantic validation schemas
│   │   └── services/                      # Risk engines, SLA & state machine rules
│   ├── alembic/                           # Database migration scripts
│   ├── scripts/                           # Database seeders & integrity verifiers
│   └── tests/                             # Pytest automated test suite
└── datasets/                              # Reference LGD geography & synthetic datasets
```

---

## Quick Start (Local Development)

### 1. Backend Setup & Database Seeding

```bash
# 1. Navigate to backend
cd backend

# 2. Apply database migrations
alembic upgrade head

# 3. Import West Bengal reference geography
$env:PYTHONPATH="." ; python scripts/import_wb_data.py --data-dir ../datasets/medexa_db_final

# 4. Seed synthetic care journey database
$env:PYTHONPATH="." ; python scripts/seed_operational_demo.py

# 5. Start FastAPI development server (http://127.0.0.1:8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup & Development

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server (http://localhost:5173)
npm run dev
```

---

## Demo Credentials (Government Health Worker Registry)

| Role Tier | Worker Name | Worker ID | Security PIN | Assigned Facility |
|---|---|---|---|---|
| **ASHA Worker** | Kavita Roy | `ASHA-WB-401` | `1234` | Maharajganj PHC |
| **Block Officer** | Dr. Anirban Roy | `BHO-WB-204` | `4321` | Belur Block PHC |
| **District Officer** | Dr. A. Sen | `CMOH-DIST-101` | `5678` | M. R. Bangur District Hospital |

---

## Automated Verification Suite

Run full verification across frontend, backend, database migrations, and data integrity:

```bash
# 1. Frontend ESLint, Production Build & TypeScript Typecheck
cd frontend
npm run lint
npm run build
npx tsc -p tsconfig.json --noEmit

# 2. Backend Pytest Suite & Alembic Migration Check
cd backend
python -m pytest tests -q
alembic current

# 3. Database Data Integrity & State Machine Verification
cd ..
$env:PYTHONPATH="backend"
python backend/scripts/verify_referral_integrity.py
python backend/scripts/verify_referral_projection.py
python backend/scripts/verify_dataset_integrity.py
```

---

## Detailed Documentation
For deep technical guides, architecture diagrams, API maps, and dataset specifications, see [docs/README.md](docs/README.md).
