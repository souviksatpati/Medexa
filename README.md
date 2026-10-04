# 🩺 Medexa — Continuity of Care, Village to District

**Medexa** is an offline-first, multilingual, 3-tier rural healthcare
continuity and referral platform built for **Smart India Hackathon (SIH)**.
It connects **ASHA village workers → Community Health Centres (CHC/PHC) →
Regional Hospitals** through one continuous, shared patient referral
thread — instead of patients being re-entered and lost between disconnected
systems at every stop.

> Built to **strengthen, not replace**, the existing public health referral
> chain that already exists in India.

---

## 📋 Table of Contents
- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [How It Works (Workflow)](#-how-it-works-workflow)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [Supported Languages](#-supported-languages)
- [Roadmap / Known Limitations](#-roadmap--known-limitations)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Problem Statement
Rural and underserved communities face long travel distances, shortages of
specialists, irregular diagnostics, fragmented medical records, delayed
referrals, and limited awareness of available services. Patients move
between sub-centres, primary health centres, rural hospitals, and district
hospitals **without continuity of information**. Connectivity, language,
health literacy, and affordability further affect access.

**Medexa's goal:** improve timely access, continuity, quality, and
accountability in frontline rural healthcare — without replacing the
existing public health system.

---

## ✨ Key Features

### 🧑‍⚕️ ASHA (Village) Portal
- Digital Triage with automated **RED / YELLOW / GREEN** risk scoring
  (weighted symptom chips + vitals thresholds)
- Free-text and quick-select symptom entry
- One-step patient registration + referral (no redundant intake step)
- Village Referrals list with live Care Journey tracking
- Daily Medicine Dispensing Log (frontline symptom relief, separate from
  hospital referrals)
- Role-locked geography (only their own village/block visible)

### 🏥 Community Health Centre (CHC/PHC) Portal
- Unified **CHC Patient Referral & Admission Queue** — incoming ASHA
  referrals + walk-in patients in one place
- Walk-in patient intake
- Escalation to Regional Hospital
- Doctor Availability, Medicine Availability, Diagnostics management
- Emergency Red Triage tracking

### 🏨 Regional Hospital Portal
- Multi-CHC referral aggregation
- Tertiary care, admissions, specialist coordination
- High-Risk Follow-up (driven by real triage data)
- Facility dashboards and Reports (sortable, exportable)

### 🌍 Cross-cutting
- **Offline-first**: works with poor/no connectivity, syncs when back online
- **12-language multilingual support**
- **Longitudinal Health Record** (ABHA-ID-aware, FHIR-style export)
- **Strict role-based data isolation** — every role sees only its own
  village/facility/district, enforced server-side (not just hidden in UI)
- Emergency SOS escalation + teleconsultation entry point
- Real Indian government geography data (State → District → Block → Village)

---

## 🔄 How It Works (Workflow)

1. **Digital Triage & Registration** — ASHA records symptoms + vitals;
   system auto-calculates risk level.
2. **Referral (ASHA → CHC/PHC)** — Case is referred to the ASHA's assigned
   facility with transport/escort details.
3. **Follow-up** — Referral status moves through **Referral Submitted → In
   Transit → Completed**, visible to both ASHA and CHC on the same record.
4. **Escalation (CHC → Regional Hospital)** — If needed, the case continues
   up the chain as the same episode, not a new record.
5. **Back-referral** — On completion/discharge, the outcome is sent back to
   the originating ASHA, closing the loop for local follow-up.

---

## 🏗️ Architecture

```
┌─────────────────────────────┐
│   React + TypeScript + Vite │   ← Frontend (offline-first)
│   Dexie.js (IndexedDB)      │   ← Local sync queue / cache
└──────────────┬───────────────┘
               │ REST API (JWT auth)
┌──────────────▼───────────────┐
│   Python (FastAPI-style)     │   ← Backend
│   SQLAlchemy / asyncpg       │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│       PostgreSQL              │   ← System of record
│  (Alembic migrations)         │
└───────────────────────────────┘
```

- **Frontend** is offline-capable: an ASHA worker can register a patient
  with no connectivity; data queues locally and syncs once online.
- **Backend** is the single source of truth. Every read/write is scoped
  server-side to the authenticated worker's role and geography via JWT —
  cross-role or cross-facility access is rejected with a 403, not just
  hidden in the UI.
- **Database** is relational (PostgreSQL), matching the inherently
  relational nature of referrals, care episodes, and facility hierarchies.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | Core UI framework |
| Vite | Build tool / dev server |
| Tailwind CSS | Styling |
| Zustand | State management |
| Dexie.js (IndexedDB) | Offline-first local storage |
| i18n (12 languages) | Multilingual support |
| Recharts | Reports / data visualization |

### Backend
| Technology | Purpose |
|---|---|
| Python | Core backend language |
| FastAPI-style framework | REST API |
| SQLAlchemy + asyncpg | ORM / async DB access |
| Alembic | Database migrations |
| passlib + bcrypt | Credential hashing |
| JWT | Stateless authentication |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL | Primary relational data store |

### Data
| Source | Purpose |
|---|---|
| Government LGD dataset (`village-directory.csv`) | Real Indian geography: ~690,000 villages, 36 states, 742 districts, ~7,600 blocks |

---

## 📁 Project Structure

```
Medexa/
├── README.md
├── docs/                         # Architecture & workflow documentation
├── frontend/                     # React + TypeScript + Vite app
│   ├── src/
│   ├── public/
│   └── scripts/                  # geo-data generation, RBAC verification
└── backend/                      # Python (FastAPI-style) + PostgreSQL
    ├── app/
    ├── migrations/                # Alembic migration files
    └── requirements.txt
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (for the frontend)
- Python 3.x (for the backend)
- PostgreSQL

### 1. Database
```bash
# Install & start PostgreSQL, then create the database
createdb medexa_db
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt --break-system-packages
cp .env.example .env     # set your local DATABASE_URL
alembic upgrade head     # run migrations
python seed.py           # seed demo accounts
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`, with the API served
at `http://localhost:8000`.

---

## 🔐 Demo Credentials

| Role | Worker ID | Name | Facility |
|---|---|---|---|
| ASHA | `ASHA-WB-401` | Kavita Roy | Kumarpur  Village |
| CHC/PHC | `BHO-WB-204` | Dr. Anirban Roy | Sarenga Block PHC |
| Regional Hospital | `CMOH-DIST-101` | Dr. A. Sen | Bankura District General Hospital |

> Demo credentials are for evaluation purposes only.

---

## 🌐 Supported Languages
Medexa supports **12 Indian languages**, selectable from a single
language switcher that applies across the entire platform — landing page,
all three portals, forms, and status labels.

---

## 🗺️ Roadmap / Known Limitations
- Full two-way ABDM/FHIR interoperability (currently a designed capability
  with a FHIR-style export)
- Offline conflict resolution for simultaneous multi-device edits
- Expanded diagnostic-coordination (lab order tracking)
- State-level analytics for quality monitoring at scale

We believe in documenting what's genuinely working versus in progress
rather than overstating completeness — see `docs/` for detailed status.

---

## 🤝 Contributing
This project was built for Smart India Hackathon (SIH). Contributions,
issues, and feature suggestions are welcome via GitHub Issues and Pull
Requests.

---

## 👤 Author
**Souvik Satpati**
Full-Stack Developer | ML/Data Science Enthusiast
Kolkata, India
