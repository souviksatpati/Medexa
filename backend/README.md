# Medexa — Backend

FastAPI + PostgreSQL backend implementing the Care Episode domain model,
the enforced referral state machine, and the Referral Rescue continuity
layer. See `MEDEXA_CANONICAL_PROJECT_CONTEXT.md` for full architectural
reasoning — this README maps folders to that document.

## Setup (without Docker)

```bash
cd medexa-backend
python -m venv venv
source venv/bin/activate          # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env              # then edit DATABASE_URL if not using Docker's db service

# Start Postgres yourself if not using Docker Compose, then:
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
python -m scripts.seed_demo_data

uvicorn app.main:app --reload     # http://localhost:8000
```

## Setup (with Docker Compose — recommended, run from the project root, not medexa-backend/)

```bash
docker compose up --build
docker compose exec backend alembic revision --autogenerate -m "initial schema"
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.seed_demo_data
```

Backend: http://localhost:8000 — interactive docs at `/docs`.
Frontend: http://localhost:5173.

The seed script prints a `referral id` that is **already SLA-breached**
the moment it's seeded (created 10 hours in the past against a 6-hour
acknowledgement window) — `GET /referrals/{that_id}` immediately
triggers the Rescue Engine, so you can demonstrate Referral Rescue
without waiting for a real deadline to pass.

## Structure

```
app/
├── core/
│   ├── config.py            All settings/thresholds, including SLA windows per stage
│   ├── database.py          Async SQLAlchemy engine + session + Base
│   ├── security.py          JWT + password hashing
│   └── dependencies.py      get_current_user, require_roles (RBAC)
│
├── models/
│   ├── patient.py            FHIR Patient
│   ├── care_episode.py       THE root entity
│   ├── encounter.py          FHIR Encounter
│   ├── observation.py        FHIR Observation + TriageAssessment (clinical_risk_level)
│   ├── referral.py           FHIR ServiceRequest + full state enum + audit trail
│   ├── continuity.py         NEW: ContinuityRiskScore, ReferralSla, ReferralRescueAction,
│   │                         BackReferral, FollowUpTask, ReferralFailureReason
│   ├── facility.py           FHIR Organization/Location + pathway-visibility fields
│   ├── user.py                Auth + RBAC roles
│   └── audit_log.py          Generic "who changed what, when"
│
├── schemas/                 Pydantic v2 — what openapi-typescript reads to generate frontend types
│   └── continuity.py         NEW: schemas for the above
│
├── services/
│   ├── referral_state_machine.py   THE authoritative transition table
│   ├── clinical_risk_engine.py     Patient-condition urgency ONLY
│   ├── continuity_risk_engine.py   NEW: care-journey failure probability ONLY —
│   │                                structurally separate from clinical risk, always
│   ├── sla_engine.py                NEW: computes per-stage due dates, checks breach
│   ├── sla_rescue_engine.py         NEW: detects breaches, logs auditable rescue actions
│   └── dashboard_aggregation.py     Exact continuity metrics, now SLA-aware per referral
│
├── routers/
│   ├── referrals.py          Creates SLA row on referral creation, checks rescue on
│   │                         every read, exposes back-referral + failure-reason endpoints
│   ├── continuity.py         NEW: continuity risk scoring + follow-up task listing
│   └── ... (one file per resource, thin — business logic lives in services/)
│
└── main.py                  App assembly, CORS, router registration

alembic/                    Real, reviewable migrations — never hand-edit the schema
scripts/seed_demo_data.py   Bootstraps facilities + users + ONE pre-breached referral
tests/                       21 tests — prioritizes the state machine, both risk engines
                             (kept in separate test files on purpose), and SLA date math
```

## The hard rule this codebase enforces structurally

Clinical risk (`ClinicalRiskLevel`, `clinical_risk_engine.py`,
`/triage/score`) and continuity risk (`ContinuityRiskLevel`,
`continuity_risk_engine.py`, `/continuity/risk-score/{id}`) are **never**
the same enum, the same service, the same schema, or the same endpoint.
A patient can be clinically low-risk and continuity high-risk at the
same time. If you ever find yourself tempted to merge these into one
field to save a join, don't — see `MEDEXA_CANONICAL_PROJECT_CONTEXT.md`
Section 16 for why.

## Referral Rescue, in one sentence

Every `GET /referrals/{id}` re-checks whether the referral's current
stage has breached its SLA and, if so, logs a `ReferralRescueAction`
(notify the referring worker, or escalate to a supervisor on repeat
breach) — this is "operational continuity intelligence, not autonomous
clinical diagnosis": it detects and logs, a human decides and acts.

## What's intentionally NOT built

No live ABDM API integration, no real medicine inventory management
(only seeded visibility), no production-grade auth provider, no
full-text search, no background job scheduler (rescue checks run
on-read rather than as a periodic sweep — a documented simplification
for the prototype, not an oversight — see `sla_rescue_engine.py`'s
docstring).

## Running tests

```bash
pytest
```

21 tests, organized to mirror the architectural separation: clinical risk,
continuity risk, the referral state machine, and SLA date math each have
their own file. If you're prepping for judge Q&A, read
`test_continuity_risk_engine.py` first — it directly tests the "a
patient can be clinically fine but continuity high-risk" claim.
