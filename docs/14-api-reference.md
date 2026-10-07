# 14. API Reference Map — Medexa

## OpenAPI Schema & Interactive Docs
FastAPI automatically generates interactive OpenAPI documentation:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`
- **OpenAPI JSON Spec**: `http://127.0.0.1:8000/openapi.json` (exported at `backend/openapi-live.json`).

---

## Key Endpoint Groups

### 1. Authentication (`/auth`)
- `POST /auth/login`: Authenticate worker credentials and return JWT bearer token.
- `GET /auth/me`: Get current authenticated user profile and assigned facility.

### 2. Patients (`/patients`)
- `POST /patients`: Register a new patient record.
- `GET /patients/{id}`: Fetch patient details by UUID.
- `GET /patients/search?q={query}`: Search patients by name, phone, or ID.

### 3. Care Episodes (`/care-episodes`)
- `POST /care-episodes`: Create a new care episode for a patient.
- `GET /care-episodes/{id}`: Retrieve care episode and linked triage assessments.

### 4. Digital Triage (`/triage`)
- `POST /triage`: Submit digital triage assessment record.
- `POST /triage/score`: Compute clinical risk score for symptoms and vitals.

### 5. Referrals & Transitions (`/referrals`)
- `POST /referrals`: Create a new referral.
- `GET /referrals`: List role-scoped referrals.
- `GET /referrals/{id}`: Get referral details, SLA timelines, history, and back-referral packet.
- `PATCH /referrals/{id}/transition`: Transition referral state machine.
- `POST /referrals/back-referral`: Create back-referral packet.

### 6. Continuity & Follow-ups (`/continuity`)
- `GET /continuity/follow-ups`: List follow-up tasks for frontline worker.
- `PATCH /continuity/follow-ups/{id}?status=completed`: Mark follow-up task completed.
- `POST /continuity/risk-score`: Compute continuity risk score for a care episode.

### 7. Facilities & Dashboard (`/facilities`, `/dashboard`)
- `GET /facilities`: List reference health facilities.
- `GET /dashboard/facility`: Get aggregated referral, SLA, and continuity metrics.
