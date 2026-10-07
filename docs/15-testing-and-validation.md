# 15. Testing & Verification Suite — Medexa

## Verification Architecture

Medexa includes a comprehensive multi-tier automated test suite covering frontend static analysis, production bundling, backend unit/integration tests, database migration state, and domain data integrity scripts.

---

## 1. Frontend Automated Verification

### ESLint Code Quality
- **Command**: `npm run lint` (executed from `frontend/`)
- **Scope**: Scans all TypeScript (`.ts`) and React (`.tsx`) files against project ESLint rules.
- **Expected Outcome**: **0 errors** (Exit code `0`).

### TypeScript Strict Type Check
- **Command**: `npx tsc -p tsconfig.json --noEmit` (executed from `frontend/`)
- **Scope**: Validates all interfaces, props, models, and type definitions without emitting Javascript output.
- **Expected Outcome**: **0 type errors** (Exit code `0`).

### Production Build Bundling
- **Command**: `npm run build` (executed from `frontend/`)
- **Scope**: Compiles TypeScript modules (`tsc -b`) and bundles production assets via Vite (`vite build`).
- **Output Artifacts**: `dist/assets/index-*.js`, `dist/assets/index-*.css`, PWA service worker (`dist/sw.js`).
- **Expected Outcome**: Clean compilation with exit code `0`.

---

## 2. Backend Automated Verification

### Pytest Unit & Integration Suite
- **Command**: `python -m pytest backend/tests -q`
- **Scope**: Runs 34 automated unit and integration tests covering:
  - Clinical Risk Engine (`test_clinical_risk_engine.py`)
  - Continuity Risk Engine (`test_continuity_risk_engine.py`)
  - Facility Care Pathway (`test_facility_pathway.py`)
  - Referral State Machine (`test_referral_state_machine.py`)
  - SLA Engine (`test_sla_engine.py`)
  - Data Validator (`test_wb_data_validator.py`)
- **Expected Outcome**: **34 passed** in ~1.5 seconds.

### Alembic Migration Verification
- **Command**: `alembic current` (executed from `backend/`)
- **Scope**: Queries PostgreSQL `alembic_version` table to verify current migration head.
- **Expected Revision**: `d7f3a2b1c9e0 (head)`.

---

## 3. Database Data Integrity Verifiers

### Referral State Machine Integrity Script
- **Command**: `$env:PYTHONPATH="backend"; python backend/scripts/verify_referral_integrity.py`
- **Scope**: Validates all persisted state transition rows (`referral_state_transitions`) against legal state machine transitions.
- **Expected Output**: `Total transition rows: 50 | Invalid transitions: 0`.

### Referral Projection Verification Script
- **Command**: `$env:PYTHONPATH="backend"; python backend/scripts/verify_referral_projection.py`
- **Scope**: Verifies that every referral's `current_state` matches its latest transition history record.
- **Expected Output**: `Total referrals: 50 | State mismatches: 0`.

### Dataset Integrity Script
- **Command**: `$env:PYTHONPATH="backend"; python backend/scripts/verify_dataset_integrity.py`
- **Scope**: Verifies foreign key alignment across Patients, Care Episodes, Triage Assessments, Referrals, SLAs, Follow-ups, Rescue Actions, and Back-Referrals. Ensures zero orphan records and zero patient ID mismatches.
- **Expected Output**: `Integrity Error Count: 0 | SUCCESS: All dataset relationships valid!`.
