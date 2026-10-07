# Medexa

**Offline-first care continuity and referral tracking for rural and underserved healthcare.**

Medexa is a prototype platform for frontline health workers, block-level care teams, and district health officials. It connects patient registration, triage, referrals, facility coordination, and post-referral follow-up in one care journey. The project is developed for Smart India Hackathon 2026 problem statement **SIH26133**.

## What it does

- **Supports frontline work offline:** the installable React PWA uses IndexedDB (Dexie) to store local data and queue changes for synchronization.
- **Keeps patient identity consistent:** UUID-based patient and care-episode identifiers link records across the referral workflow.
- **Enforces referral transitions:** the backend validates referral state changes and keeps transition history for auditing. The workflow includes `DRAFT`, `SENT`, `RECEIVED`, `ACCEPTED`, `APPOINTMENT_QUEUED`, `CONSULTED`, `REFERRED_BACK`, `FOLLOW_UP_DUE`, `FOLLOW_UP_COMPLETED`, and `CLOSED`, plus exception states such as `REJECTED`, `CANCELLED`, `EXPIRED`, `PATIENT_NO_SHOW`, and `EMERGENCY_ESCALATED`.
- **Tracks continuity risks and SLAs:** separate clinical and continuity risk services support overdue-referral monitoring, rescue actions, and follow-up.
- **Coordinates back-referrals and facility information:** care teams can track post-treatment handoffs, follow-up tasks, facility services, and availability.
- **Provides role-based views:** ASHA, block, and district workflows are protected by role-based access control.

Medexa provides workflow and decision-support tools; it is not an autonomous diagnostic system.

## Technology

- **Frontend:** React 18, TypeScript, Vite, React Router, Zustand, Zod, Dexie, Leaflet, and a PWA service worker.
- **Backend:** FastAPI, Pydantic, SQLAlchemy async, Alembic, and JWT-based authentication.
- **Database:** PostgreSQL.
- **Development orchestration:** Docker Compose.

## Run locally with Docker Compose

### Prerequisites

- Docker Desktop (or Docker Engine) with the Compose plugin
- Git, to clone the repository

From the repository root:

```bash
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.import_wb_data --data-dir ../datasets/medexa_db_final
docker compose exec backend python -m scripts.seed_operational_demo
```

The geography import must complete before the operational demo seed, because that seed links demo users and care data to facilities from the dataset.

Open:

- Frontend: <http://localhost:5173>
- Backend health check: <http://localhost:8000/health>
- Interactive API documentation: <http://localhost:8000/docs>

To stop the services:

```bash
docker compose down
```

To also remove the local PostgreSQL data volume and start with an empty database:

```bash
docker compose down -v
```

**Development only:** the Docker Compose file includes local database credentials and a placeholder JWT signing key for convenience. Replace these and configure secure secrets before any deployment; do not use the Compose defaults in production.

### Frontend demo logins

The frontend login screen uses the demo health-worker registry:

| Role | Worker ID | PIN |
|---|---|---|
| ASHA worker | `ASHA-WB-401` | `1234` |
| Block officer | `BHO-WB-204` | `4321` |
| District officer | `CMOH-DIST-101` | `5678` |

These are public prototype credentials, not secure production accounts. The frontend maps these role logins to backend demo users; run the database setup and seed steps above to enable backend authentication. See [`frontend/src/auth/auth.ts`](frontend/src/auth/auth.ts) and [`backend/scripts/seed_operational_demo.py`](backend/scripts/seed_operational_demo.py).

## Run frontend checks

Install frontend dependencies and start the Vite development server:

```bash
npm --prefix frontend install
npm run dev
```

The frontend runs at <http://localhost:5173> and proxies `/api` requests to the backend at `http://localhost:8000`.

Available root-level checks:

```bash
npm run lint
npm run build
npm --prefix frontend run test -- --run
npm run verify:geo
npm run verify:rbac
```

## Run backend tests

With the backend dependencies installed and the project database configured:

```bash
cd backend
python -m pytest tests -q
```

## Repository layout

```text
backend/
  app/
    core/         Configuration, database, security, and dependencies
    models/       SQLAlchemy domain models
    routers/      FastAPI endpoints
    schemas/      Pydantic API schemas
    services/     Referral, risk, SLA, and dashboard logic
  alembic/        Database migrations
  scripts/        Dataset import, demo seeding, and integrity checks
  tests/          Backend test suite
datasets/
  medexa_db_final/ West Bengal geography and synthetic demo data
docs/              Architecture, workflows, API, deployment, and testing guides
frontend/
  src/             React application, domain models, API, and offline sync
  public/          Static assets and PWA files
scratch/           Development and exploratory scripts
```

## Documentation

Start at [`docs/README.md`](docs/README.md) for the documentation index. Key references include:

- [System architecture](docs/03-system-architecture.md)
- [Care continuity workflow](docs/05-care-continuity-workflow.md)
- [Offline-first design and synchronization](docs/09-offline-first-and-sync.md)
- [Authentication and role-based access](docs/10-authentication-and-rbac.md)
- [API reference](docs/14-api-reference.md)
- [Testing and validation](docs/15-testing-and-validation.md)
- [Deployment](docs/16-deployment.md)
