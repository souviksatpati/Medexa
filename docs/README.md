# Medexa — System Documentation Suite

Welcome to the canonical technical documentation for **Medexa** — an offline-first care-continuity and referral-tracking platform designed for rural and underserved healthcare tiers (SIH 2026, SIH26133).

---

## Technical Documentation Index

1. [01. Product Overview](01-overview.md) — Problem context, core mission, and key system capabilities.
2. [02. Requirements & Scope](02-requirements-and-scope.md) — Functional and non-functional requirements, tier boundaries, and system constraints.
3. [03. System Architecture](03-system-architecture.md) — End-to-end multi-tier architecture diagram, technical stack, and data flow.
4. [04. Canonical Domain Model](04-domain-model.md) — Entity relationships, schemas, and Single Patient Identity strategy (`patient_id` / `care_episode_id`).
5. [05. End-to-End Care Continuity Workflow](05-care-continuity-workflow.md) — Step-by-step walkthrough from ASHA patient intake to back-referral and home follow-up.
6. [06. Frontend Architecture](06-frontend-architecture.md) — React, TypeScript, Vite, Dexie IndexedDB local store, Zustand, and PWA structure.
7. [07. Backend Architecture](07-backend-architecture.md) — FastAPI, Pydantic, SQLAlchemy async ORM, domain services, and router structure.
8. [08. Database & Migrations](08-database-and-migrations.md) — PostgreSQL database schema, constraints, indexes, and Alembic migration history.
9. [09. Offline-First & Sync Engine](09-offline-first-and-sync.md) — Local storage, pending operations queue, background synchronization, and idempotency.
10. [10. Authentication & RBAC](10-authentication-and-rbac.md) — JWT authorization flow, session restoration, and role-based data isolation.
11. [11. Digital Triage & Risk Decision Support](11-triage-risk-referral.md) — Clinical risk engine, vitals assessment, decision support, and referral form pre-population.
12. [12. SLA Engine, Rescue & Follow-up](12-sla-rescue-followup.md) — Service Level Agreements, automated breach detection, rescue escalations, and home follow-up tasks.
13. [13. Dataset Architecture & Pilot Geography](13-dataset-and-geography.md) — Synthetic care journey dataset, West Bengal LGD pilot geography, and dataset verification.
14. [14. API Reference Map](14-api-reference.md) — REST endpoint groups, request/response payload contracts, and OpenAPI integration.
15. [15. Testing & Verification Suite](15-testing-and-validation.md) — ESLint, TypeScript typecheck, Vite production build, pytest backend suite, and automated database verifiers.
16. [16. Production Deployment Guide](16-deployment.md) — Native execution, environment configuration, production bundling, and containerization.
17. [17. Diagnostics & Troubleshooting](17-troubleshooting.md) — Operational troubleshooting, sync error resolution, and common diagnostic procedures.

---

## Canonical Document Principles
- **One Source of Truth**: All documentation reflects the **actually implemented codebase** as verified by our zero-error test suite.
- **Single Patient Identity**: Every patient record maintains a permanent, immutable `patient_id` UUID across all care tiers.
- **Offline Integrity**: Offline actions are guaranteed to sync idempotently without record duplication or loss.
