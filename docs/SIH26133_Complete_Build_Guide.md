# SIH26133 — Complete Build Guide (Zero to Working Prototype)
### Care Continuity Layer for Rural/Underserved Healthcare

---

## 0. The Product Thesis (Read This Before Anything Else)

**We are not replacing rural healthcare infrastructure. We are building a digital care-continuity and coordination layer across the existing public-health network, designed to function despite connectivity and resource constraints.**

This is not a tagline — it's the lens every architecture, feature, UX, database, and implementation decision runs through from here on.

### The core design constraint: "strengthening — not replacing — the public-health system"
This sentence is buried in the middle of the official problem statement, but it's the most important constraint in it. It rules out the obvious wrong answer — "build a new healthcare app for rural India" — and points at the actual right answer: **a coordination layer that sits across the existing chain** (Sub-centre -> PHC -> Rural Hospital -> District Hospital) and improves information flow, referral continuity, and follow-up, without asking anyone to abandon how care is actually delivered today.

Practically, this means:
- We never pitch "replacing" any existing process, role, or system — only reducing information loss, delay, and uncertainty inside the process that already exists.
- Every screen maps to something a real ASHA worker, doctor, or district officer already does — just made continuous and visible across facility boundaries.
- Adoption friction is a first-class design concern. If a feature requires a frontline worker to dramatically change how she works, that's a strike against it.

**The adoption argument, stated precisely (have this ready verbatim for judges):**

> Before: Patient → ASHA → phone call → PHC → paper/WhatsApp/memory → referral → ??? (no tracked outcome)
> With our system: Patient → ASHA → digital triage → digital referral → PHC → doctor → follow-up → closed-loop record
>
> The worker's workflow doesn't fundamentally change. The information flow does.

### Central concept: Care Continuity, and its three sub-continuities
Compress the entire SIH problem statement into one sentence: *a patient's care journey is fragmented across facilities, people, services, and connectivity conditions, causing delays, information loss, and poor follow-up.* Our system exists to create continuity across three dimensions simultaneously:

```
                     CARE CONTINUITY LAYER
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
        INFORMATION        REFERRAL        FOLLOW-UP
          CONTINUITY        CONTINUITY       CONTINUITY
             |                |                |
       +-----+-----+          |          +-----+-----+
       |           |          |          |           |
    Triage     Patient     Referral    Risk       Follow-up
               History      State      Engine       Engine
                               |
                               v
                       Facility Network
                               |
                               v
                    QUALITY & ACCOUNTABILITY
                               |
                               v
                       DISTRICT DASHBOARD

       -------------------------------------------------
          OFFLINE-FIRST + SYNC + RBAC + AUDIT
          FHIR-ALIGNED DATA MODEL + TYPE SAFETY
       -------------------------------------------------
```

Offline-first, RBAC, audit, and FHIR-alignment are not modules — they're properties that cut across the entire system.

### Feature Governance — the operational scope-creep gate
Before building *any* feature, run it through these four questions, out loud, as a team:

1. **Does it directly address the SIH problem** (access, continuity, quality/accountability, or connectivity/language/literacy/affordability constraints)?
2. **Which stakeholder does it help** — patient, frontline worker, facility staff, or district official?
3. **What measurable outcome does it improve** — referral completion rate, follow-up compliance, time-to-consultation, data freshness?
4. **Can we demonstrate it convincingly** live, not just describe it on a slide?

If all four are a confident yes → build it. Otherwise, don't, no matter how impressive it sounds.

### What we will NOT build (decided now, so nobody re-litigates it in week 3)
- AI disease image detection (fails the filter: not central to the workflow, introduces clinical-validation risk we can't discharge)
- A generic chatbot or "LLM doctor"
- A social network for patients
- Blockchain/crypto anything
- Custom video-conferencing infrastructure (use an existing embed for the teleconsultation stretch goal)
- A full medicine marketplace
- A full hospital management system
- Full production ABDM integration
- 20 dashboards (one dashboard, decision-oriented, is the goal)
- Unnecessary IoT hardware

Every item on this list would burn real time while diluting the central story. If someone on the team gets excited about one of these mid-project, re-run the four-question filter before touching it.

---

## 1. The Hero Workflow: Referral Continuity

Of the three sub-continuities, **referral continuity is the spine of the whole product** — it's the one that touches every actor and every module:

```
Patient
   |
ASHA/ANM assessment
   |
Digital triage
   |
Risk identified
   |
Referral created
   |
PHC receives referral
   |
Doctor accepts
   |
Patient reaches facility
   |
Consultation completed
   |
Follow-up scheduled
   |
Follow-up completed
```

When a judge asks "what happens today if this referral is never completed?" — and they will — the answer is: **"our system doesn't just create a referral, it follows the referral until the patient's care episode is closed."** That single sentence is your strongest competitive positioning. Everything below exists to make that sentence literally true in your running system, not just true on a slide.

---

## 2. Core Domain Model: Care Episode

This is the single most important architectural decision in the whole project. Don't model your database as "patients + encounters + referrals" sitting loosely next to each other. Model it around **Care Episode** as the root entity — the thing that represents one patient's journey through one health concern, from first triage to closure.

```
Care Episode
│
├── Patient
├── Encounter(s)
├── Triage/Risk Assessment
├── Observations (vitals, symptoms)
├── Referral (with full state history)
├── Diagnostics (visibility, not full integration)
├── Consultation
├── Treatment notes
├── Follow-up(s)
└── Closure
```

Why this matters technically: every other table (Encounter, Referral, Observation) has a foreign key back to `care_episode_id`. This means a single query answers "show me everything that happened in this patient's journey, in order" — which is *exactly* the continuity story you're telling. Without this root entity, you'd need to manually stitch together patient history from scattered tables, and your "longitudinal record" claim becomes weaker in practice than in your pitch.

**Build order for this model:** start with `Patient`, `CareEpisode`, `Encounter`, `Referral` — get those four working end-to-end first. Add `Observation`, `Diagnostic`, `FollowUp` as separate tables once the core loop works, each still hanging off `care_episode_id`.

---

## 3. The Referral State Machine

Don't implement referral tracking as `pending/completed`. Build a real lifecycle — this is what gives you a genuine domain model instead of CRUD screens, and it's your best source of substantive technical discussion with judges (state transitions, authorization per transition, audit logs, sync conflict handling, SLA monitoring).

### Phased build order (start simpler, add depth — see Section 9 for why)

**Core states to build first (get this working offline + syncing before anything else):**
```
DRAFT -> SENT -> ACCEPTED -> CONSULTED -> FOLLOW_UP_DUE -> FOLLOW_UP_COMPLETED -> CLOSED
```

**Add once the core loop is solid:**
```
DRAFT -> SENT -> RECEIVED -> ACCEPTED -> APPOINTMENT/QUEUE -> CONSULTED
      -> REFERRED_BACK / TREATMENT -> FOLLOW_UP_DUE -> FOLLOW_UP_COMPLETED -> CLOSED
```

**Exceptional states (add these once the happy path is bulletproof):**
```
REJECTED
CANCELLED
EXPIRED
PATIENT_NO_SHOW
EMERGENCY_ESCALATED
```

### Implementation approach
- Model this as an actual state machine, not a free-text `status` string. In Python/Pydantic, use an `Enum` for states and a small dict/function defining legal transitions (`ACCEPTED` can only follow `SENT` or `RECEIVED`, never `DRAFT`) — reject illegal transitions at the API layer with a clear error, don't rely on the frontend to enforce this.
- Every transition writes an `AuditLog` row: who, when, from-state, to-state, and (if offline) the device-local timestamp vs. server-received timestamp — this distinction matters for your sync-conflict story.
- Timestamps at every transition let you compute referral delay (`T_completed - T_created`) for free, which feeds directly into Section 5's dashboard metrics.

**Resource for state machine patterns:** [Python's `enum` + a simple transition-table pattern](https://docs.python.org/3/library/enum.html) is genuinely sufficient here — you do not need a heavyweight state-machine library for this project's scope.

---

## 4. The Continuity Risk Engine (Your Intelligence Layer)

We are explicitly rejecting diagnostic AI (see Section 0's "will not build" list). Instead, build a **decision-support risk flag**, not a diagnosis. This distinction matters enormously in healthcare, and you should say it in exactly these words if asked: *"This is a decision-support risk flag, not a diagnostic AI."*

### What it does
Instead of "AI diagnoses disease," this system asks: **which patients' care journeys are at risk of breaking?**

```
Patient
  │
  ├── High-risk triage result
  ├── Previous missed follow-up
  ├── Referral not accepted within SLA window
  ├── Long referral delay
  └── Chronic condition flag
          |
   Continuity Risk Score
          |
     HIGH RISK
          |
   Worker notification
          |
   Follow-up action
```

This directly supports the stated expected outcome around "better follow-up for maternal, child and chronic conditions" — it's not a bolted-on feature, it's a mechanism for the follow-up continuity arm.

### Build order
1. **Start rule-based.** A simple weighted scoring function (e.g., `+3` for high-risk triage, `+2` for a missed prior follow-up, `+2` for referral overdue past SLA, `+1` for chronic condition) crossing a threshold = flagged. This alone is legitimate, explainable, and fast to build — don't underrate it.
2. **Upgrade to a trained model only if time allows**, once you have enough Synthea-generated + synthetic-interaction data to train on. Logistic regression or a small XGBoost model over the same features, with a SHAP explanation for each flag (ties back to the earlier XAI concept, and reuses a resource already in your learning path).
3. Either version exposes the same API shape (`risk_score`, `risk_level`, `contributing_factors`) so your frontend doesn't need to change when you upgrade the engine underneath.

---

## 5. Dashboard: Answers Decisions, Not Numbers

The dashboard is the **quality and accountability arm** of Care Continuity — not a reporting bolt-on. Every metric on it should exist to answer: *is information, referral, and follow-up continuity actually holding up?*

### Bad dashboard
> Total Patients: 14,829

### Right dashboard — Referral Continuity metrics
```
Referral Continuity
Total referrals             1,248
Accepted                    1,107
Completed                     982
Follow-up completed           811
Overdue                        96
No-show                        71
```

With computed metrics:
- **Referral Completion Rate** = Completed Referrals / Total Eligible Referrals × 100
- **Follow-up Compliance** = Completed Follow-ups / Follow-ups Due × 100
- **Referral Delay** = T_completed − T_created (from your state machine's timestamps, for free)

### Right dashboard — facility-level, decision-oriented view
```
Facility A
Referral completion: 94%
Avg referral delay: 4.2h

Facility B
Referral completion: 67%
Avg referral delay: 29.4h   <- ALERT

Facility C
Referral completion: 91%
Follow-up compliance: 58%   <- ALERT
```

This is the difference between a reporting page and a governance tool — a district officer looking at this can *act* (call Facility B, investigate why referrals stall there), which is precisely what "strengthening the existing system" means in practice.

---

## 6. Affordability & Care-Pathway Visibility

The official problem statement explicitly names affordability as a constraint. Don't build a financial/payment module — that's out of scope and risks distraction. Instead, build **care-pathway visibility**: when an ASHA worker creates a referral, the system surfaces:

- Recommended facility (nearest appropriate public facility, not just nearest)
- Distance
- Service availability at that facility
- Diagnostic availability
- Medicine availability (visibility only — pull from a static/seeded dataset, don't build live inventory management)
- Public facility status (open, understaffed, etc. — can be seeded/simulated for demo)

This helps the frontline worker route the patient to an appropriate *available* public pathway before sending them somewhere unnecessarily — supporting both access and affordability without a new financial module. It's a thin feature (mostly a lookup + a few fields in the referral-creation UI) with outsized narrative value.

---

## 7. The Tech Stack (Best-Available, Modern, Type-Safe End-to-End)

| Layer | Choice | Why this over alternatives |
|---|---|---|
| Frontend framework | **React + TypeScript**, scaffolded with **Vite** | Vite is the modern standard over Create React App (effectively deprecated). TypeScript catches bugs at compile time — critical when handling patient data across a multi-person team. |
| Frontend validation | **Zod** | Define data shapes once as Zod schemas, get runtime validation *and* inferred TypeScript types — no duplicated logic. |
| Offline/PWA layer | **vite-plugin-pwa** + **Dexie.js** (typed wrapper over IndexedDB) | Dexie makes IndexedDB feel like a clean typed database — a real time-saver for your offline sync queue, which is the highest-stakes code in the whole project. |
| Backend framework | **FastAPI (Python)** | Async-native, automatic OpenAPI docs (feeds your typed frontend client), strict validation via Pydantic v2, excellent documentation. |
| Backend validation | **Pydantic v2** | Ships with FastAPI, Rust-core speed, enforces strict typing on every request/response. |
| API type-safety bridge | **openapi-typescript** | Auto-generates frontend TS types from FastAPI's live OpenAPI schema. This structurally prevents frontend/backend drift on field names or types — the single most common bug class in student full-stack projects. |
| Database | **PostgreSQL** | Real relational integrity for inherently relational data (Care Episodes, Encounters, Referrals). Not negotiable for health records. |
| ORM | **SQLAlchemy 2.0 (async)** + **Alembic** for migrations | Modern SQLAlchemy has strong type-hint support. Alembic gives proper, reviewable migrations — essential when your schema (state machine states, risk-engine fields) will change weekly. |
| Auth | **JWT via FastAPI's OAuth2PasswordBearer**, role-based (ASHA worker / doctor / district officer) | Standard, well-documented, right-sized for this scale. |
| Multilingual | **Bhashini API** (Govt of India) | Free, purpose-built for Indian languages, ties into existing digital public infrastructure — a genuine narrative strength with government-affiliated judges. |
| Testing | **Vitest** (frontend) + **Pytest** (backend) | Vitest is the Vite-native equivalent of Jest — faster, zero extra config. |
| Deployment (for demo) | **Docker Compose** (Postgres + backend + frontend, one command) | Guarantees "works on my machine" never becomes a demo-day disaster. |

---

## 8. What You Actually Need to Learn (In Order)

### Stage A — Web Fundamentals + TypeScript (Week 1)
| Topic | Resource |
|---|---|
| HTML/CSS refresh | [freeCodeCamp Responsive Web Design](https://www.freecodecamp.org/learn/2022/responsive-web-design/) |
| JavaScript fundamentals | [javascript.info](https://javascript.info/) |
| TypeScript | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) |
| React (with TS) | [React official tutorial](https://react.dev/learn) + [React + TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) |
| Vite | [Vite official guide](https://vitejs.dev/guide/) |
| Git & GitHub | [GitHub's Git Handbook](https://guides.github.com/introduction/git-handbook/) |

**Goal:** `npm create vite@latest my-app -- --template react-ts` running, with a typed form that saves locally and renders a list.

### Stage B — Backend + Database (Week 1–2, parallel)
| Topic | Resource |
|---|---|
| Python basics | [Automate the Boring Stuff](https://automatetheboringstuff.com/) |
| FastAPI + Pydantic v2 | [FastAPI official tutorial](https://fastapi.tiangolo.com/tutorial/) |
| PostgreSQL + SQL | [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) |
| SQLAlchemy 2.0 (async) | [SQLAlchemy 2.0 tutorial](https://docs.sqlalchemy.org/en/20/tutorial/) |
| Alembic | [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html) |

**Goal:** FastAPI endpoints creating/reading `Patient` + `CareEpisode` records in Postgres, with your first Alembic migration committed.

### Stage C — Closing the Frontend/Backend Type Gap (Week 2)
| Topic | Resource |
|---|---|
| FastAPI's auto-generated OpenAPI schema | [FastAPI docs](https://fastapi.tiangolo.com/tutorial/first-steps/#interactive-api-docs) |
| openapi-typescript | [openapi-typescript docs](https://openapi-ts.dev/) |
| Zod | [Zod official docs](https://zod.dev/) |

**Goal:** one command regenerates frontend TS types straight from your live FastAPI schema.

### Stage D — Offline-First Design (Week 2)
This is the single most important technical differentiator for this problem statement.
| Topic | Resource |
|---|---|
| Progressive Web Apps | [web.dev PWA guide](https://web.dev/explore/progressive-web-apps) |
| vite-plugin-pwa | [vite-plugin-pwa docs](https://vite-pwa-org.netlify.app/) |
| Dexie.js | [Dexie.js official docs](https://dexie.org/docs/Tutorial/React) |
| Local-first sync patterns | [Local-first software — Ink & Switch](https://www.inkandswitch.com/local-first/) |

**Goal:** the triage + referral-creation flow works fully offline via Dexie, and syncs automatically with a visible sync-status indicator on reconnect.

### Stage E — The Referral State Machine + Care Episode Model (Week 2–3)
Build the core-state version from Section 3 on top of the Care Episode root entity from Section 2. This is pure backend modeling work — no new external resources needed beyond what Stage B already gave you. Budget real time here; this is the technical heart of the project.

### Stage F — Health Data Standards (Week 2–3, lightweight)
| Topic | Resource |
|---|---|
| FHIR basics | [FHIR Overview — HL7](https://www.hl7.org/fhir/overview.html) |
| ABDM architecture (read-only, for design alignment) | [ABDM sandbox docs](https://sandbox.abdm.gov.in/) |

**Goal:** your `CareEpisode`/`Encounter`/`Referral`/`Observation` field names map cleanly onto FHIR resources. **Do not** attempt live ABDM API integration — see Section 0's exclusion list. If asked: *"We intentionally did not claim production ABDM integration within the hackathon scope. Our data model is FHIR-compatible so an interoperability adapter can be introduced without rewriting the core system."*

### Stage G — Continuity Risk Engine (Week 3)
| Topic | Resource |
|---|---|
| ML fundamentals | [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course) |
| SHAP (only if you reach the trained-model upgrade) | [SHAP docs](https://shap.readthedocs.io/en/latest/example_notebooks/overviews/An%20introduction%20to%20explainable%20AI%20with%20Shapley%20values.html) |
| Multilingual support | [Bhashini](https://bhashini.gov.in/) |

Build the rule-based version first (Section 4). Only attempt the trained-model upgrade once everything through Stage E is solid and syncing reliably.

---

## 9. Why "Start Simple, Add Depth" — Not a Newbie Cop-Out

You're taking the ambitious version, which is the right call — but the *order* you build in still matters, independent of ambition. The reason to start with 6 referral states instead of 11, and a rule-based risk score instead of a trained model, isn't "you're beginners so do less." It's that **a working simple state machine that syncs correctly offline is worth more than a comprehensive state machine that has a sync bug nobody caught** — bugs in this class of system surface exactly when you're demoing live, disabling wifi in front of judges. Depth is the goal; sequencing depth *after* correctness is what makes the depth demonstrable instead of theoretical. Every stretch item in this guide (full 11-state machine, trained-model risk engine, facility-level dashboard alerts) is fully in scope for you — just build them in the order given so each layer sits on something already proven solid.

---

## 10. Real Data Sources (Public, No Special Access Needed)

| Data | Source | Notes |
|---|---|---|
| Public health facility locations | [Health Facility Registry (ABDM)](https://facility.abdm.gov.in/) or [data.gov.in](https://data.gov.in/) | Seeds your facility dashboard + care-pathway visibility feature with real locations |
| Rural healthcare access statistics (pitch/problem-framing) | [NFHS-5](http://rchiips.org/nfhs/nfhs5.shtml) | Real numbers on travel time, referral gaps — cite these on your problem-framing slide |
| Synthetic patient data (never use real patient data) | [Synthea](https://synthetichealth.github.io/synthea/) — realistic, FHIR-compliant synthetic records | Solves your data problem and reinforces interoperability since it's already FHIR-shaped; also useful for training the risk engine's upgrade path |
| Symptom/triage severity data | [Kaggle disease-symptom dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset) to start; [MIMIC-IV](https://physionet.org/content/mimiciv/) as a named future data source | Kaggle for speed, MIMIC-IV name-drop for rigor |
| Multilingual text/voice | [Bhashini APIs](https://bhashini.gov.in/) | Free, government-backed |

---

## 11. System Architecture

```
+-------------------------------------------------------------------+
|                FRONTLINE WORKER APP (React + TS, PWA)                 |
|  Vite + vite-plugin-pwa + Dexie.js + Zod                              |
|  - Digital triage form (fully offline-capable, Zod-validated)         |
|  - Care Episode view: patient history across visits (cached locally)  |
|  - Referral creation with pathway visibility (facility/distance/      |
|    service+diagnostic+medicine availability)                         |
|  - Continuity Risk Score display + notification                      |
|  - Background sync queue -> pushes to backend when online             |
|  - Types generated from backend OpenAPI schema (openapi-typescript)   |
+---------------------------+-----------------------------------------+
                             v (sync when connectivity available)
+-------------------------------------------------------------------+
|                   BACKEND API (FastAPI + Pydantic v2)                 |
|  POST /care-episodes          -> create/update episode                |
|  GET  /care-episodes/{id}     -> full longitudinal journey            |
|  POST /referrals              -> create referral (state: DRAFT)       |
|  PATCH /referrals/{id}/transition -> enforced state-machine transition|
|  GET  /dashboard/facility     -> referral-continuity metrics          |
|  POST /triage/score           -> continuity risk-scoring endpoint     |
|  - JWT auth, role-based (ASHA worker / doctor / district officer)     |
|  - Referral state machine: legal-transition enforcement + AuditLog    |
|  - Sync conflict resolution (last-write-wins + audit trail)           |
|  - Auto-generated OpenAPI schema -> feeds frontend type generation    |
+---------------------------+-----------------------------------------+
                             v
+-------------------------------------------------------------------+
|           DATABASE (PostgreSQL, SQLAlchemy 2.0 async + Alembic)       |
|  Root entity: CareEpisode                                             |
|  Patient | CareEpisode | Encounter | Referral (+ state history) |     |
|  Observation | Facility | Appointment | AuditLog                      |
|  All FHIR-aligned resource names                                      |
+---------------------------+-----------------------------------------+
                             v
+-------------------------------------------------------------------+
|   FACILITY / DISTRICT DASHBOARD (React + TS)                          |
|   -- the Quality & Accountability arm of Care Continuity,             |
|      not a reporting bolt-on                                          |
|  - Referral funnel (sent -> accepted -> completed -> follow-up)       |
|  - Referral completion rate, follow-up compliance, referral delay     |
|  - Facility-level alerts (below-threshold completion/compliance)      |
|  - Data freshness indicator (sync lag from field devices)             |
|  Each metric answers: is continuity actually holding up, and where    |
|  should a district officer intervene?                                 |
+-------------------------------------------------------------------+
```

### Why this design avoids "loopholes" judges probe for
1. **End-to-end type safety** — Zod, Pydantic, and openapi-typescript mean a mismatched field is a build error, not a demo-day surprise.
2. **Offline-first is architectural** — Dexie + a real sync queue, not a slide bullet.
3. **Enforced state machine, not a free-text status field** — illegal transitions are rejected server-side.
4. **Role-based access control** — different views for different actors, frequently skipped by other teams.
5. **Audit logging on every state transition** — "who changed what, when" for patient data is a real requirement, and it's what powers your referral-delay metrics for free.
6. **FHIR-aligned Care Episode model** — your schema itself backs the interoperability claim, without claiming production ABDM integration.
7. **Explicit sync conflict handling** — documented strategy (last-write-wins + audit trail), not hand-waved.
8. **Reproducible environment via Docker Compose** — "works on my machine" cannot become a demo-day failure.

---

## 12. Software Engineering Practices (Non-Negotiable)

- **Git from day one** — feature branches, real commit messages, README with setup instructions.
- **Docker Compose for local dev** — one command brings up Postgres + backend + frontend consistently for every teammate.
- **Environment reproducibility** — locked dependency files, tested on a clean machine before demo day.
- **Config over hardcoding** — DB credentials, API keys in `.env`, never in code.
- **Input validation everywhere** — Zod on the frontend, Pydantic on the backend.
- **State-machine transitions enforced server-side**, never trusted from client input alone.
- **Error handling on sync logic** — failed sync must never silently drop data; log, retry, surface in the UI.
- **Tests** — Vitest for the sync queue, Pytest for the referral state machine (explicitly test: "what happens if two people edit the same referral offline at once?").
- **Type generation wired into an npm script**, not a manual chore.
- **Privacy-by-design statement ready** — encryption at rest, role-based access, Synthea-only data in the demo.
- **A clear "Scope & Future Work" slide** — name what's excluded (Section 0's list, plus full ABDM integration) and how the architecture supports adding it without a rewrite.

---

## 13. Phased Build Plan

| Phase | Duration | Deliverable |
|---|---|---|
| **Phase 1 — Learn + Setup** | Week 1 | Vite+React+TS frontend, FastAPI backend, Postgres — running via Docker Compose; Git repo live |
| **Phase 2 — Care Episode Core** | Week 1–2 | `Patient`, `CareEpisode`, `Encounter` tables via SQLAlchemy + Alembic; Synthea data loaded; first openapi-typescript generation working |
| **Phase 3 — Offline Triage Flow** | Week 2 | Dexie-backed PWA triage form works offline, syncs to backend, Care Episode history view working |
| **Phase 4 — Core Referral State Machine** | Week 2–3 | 6-state happy-path referral lifecycle (DRAFT→SENT→ACCEPTED→CONSULTED→FOLLOW_UP_DUE→FOLLOW_UP_COMPLETED→CLOSED), enforced server-side, audit-logged, tested with Pytest |
| **Phase 5 — Full State Machine + Risk Engine** | Week 3 | Add RECEIVED/APPOINTMENT/exceptional states; ship rule-based Continuity Risk Engine |
| **Phase 6 — Dashboard** | Week 3–4 | Referral-continuity metrics, facility-level alerting view, data freshness indicator |
| **Phase 7 — Pathway Visibility + Polish** | Week 4 | Affordability/care-pathway visibility in referral creation; multilingual triage (Bhashini) |
| **Phase 8 — Risk Engine Upgrade + Stretch** | Week 4–5 | Trained-model risk score with SHAP (if time allows); teleconsultation stub; presentation deck |
| **Grand Finale (if selected)** | 36 hrs | Live-demo hardening, the 5-act demo (Section 14) rehearsed end-to-end, judge Q&A prep |

---

## 14. The Demo: One Patient Journey, Five Acts

Not ten dashboards. Not twenty AI features. One patient journey, told live, in about three minutes.

**Act 1 — Village.** ASHA identifies a high-risk patient. Device is offline. She performs digital triage. System flags: *"High-risk — referral recommended."* She creates the referral. It saves locally — UI shows *"Offline — 1 record waiting to sync."*

**Act 2 — Connectivity disappears (literally, on stage).** Disable wifi in front of the judges. She can still open the patient, see full Care Episode history, create the referral, record the encounter. No spinner. No error page. No "internet connection required."

**Act 3 — Connectivity returns.** Reconnect. Sync queue fires. UI shows *"3/3 records synchronized"* with server confirmation.

**Act 4 — PHC.** Doctor logs in, sees the referral appear, accepts it (state transitions: SENT → ACCEPTED), consultation is recorded (→ CONSULTED), follow-up scheduled (→ FOLLOW_UP_DUE).

**Act 5 — District dashboard.** District officer sees the referral funnel update in real time: created → accepted → completed → follow-up due, and later, follow-up completed. Facility-level view shows where other referrals in the system are stalling.

That is the entire product thesis, demonstrated end-to-end, live. Rehearse this exact sequence enough times that a teammate could run it cold.

---

## 15. Your Six-Pillar Differentiation Matrix (Use This in Your Pitch Deck)

| Pillar | What we demonstrate |
|---|---|
| Care Continuity | Patient journey doesn't disappear between facilities |
| Offline-First | System works without connectivity, demonstrated live |
| Closed-Loop Referral | Referral is tracked until completion/follow-up, via an enforced state machine |
| Quality & Accountability | District officers see exactly where care continuity breaks, and can act |
| FHIR-Aligned | Architecture is interoperable by design, without overclaiming ABDM integration |
| Responsible Intelligence | AI predicts continuity risk as decision support — not a diagnostic claim |

---

## 16. Pick a Pilot Region + Persona Now

Pick one real district (use NFHS-5 data to justify — somewhere with documented poor referral completion or maternal-follow-up gaps), one ASHA-worker persona, and one district-officer persona. Walk through their actual day using your system in your pitch — concreteness beats generic framing every time.

---

## 17. What to Tell Your Team Right Now

1. Assign roles: 1–2 on Stage A+B+C (TypeScript/React/FastAPI/type-bridge), 1 person going deep on Stage D (offline-first) and the sync side of the state machine, 1–2 on Stage E+F+G (Care Episode model, referral state machine, risk engine).
2. Get Docker Compose running (Postgres + FastAPI + Vite/React/TS) this week.
3. Load Synthea data immediately.
4. Design the `CareEpisode` schema on a whiteboard before writing a single migration — this is the decision everything else depends on.
5. Come back to me at each phase — I can scaffold actual code, build out the state-machine enforcement logic, wire the offline sync queue, build the risk engine (both rule-based and trained versions), and build the dashboard with you.

Want me to scaffold the actual starter project now — Docker Compose setup, the `CareEpisode`/`Referral` schema with Alembic migrations, FastAPI endpoints with the state-machine transition logic, and the Vite+React+TS frontend with the type-generation pipeline wired up — so your team has real, running code tomorrow?
