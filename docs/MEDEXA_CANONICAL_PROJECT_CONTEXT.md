# MEDEXA — SIH26133 Canonical Project Context & AI Handoff

> **READ THIS FIRST.** This is the canonical project context for any AI coding, architecture, research, or product-design assistant working on this repository.
>
> The assistant receiving this file did **not** participate in the earlier project discussions. Do not discard, simplify, or replace the decisions below with a generic healthcare-app architecture.
>
> **Canonical project name: MEDEXA**
>
> Repository: `https://github.com/deb1704-student/Medexa`
>
> SIH problem statement: **SIH26133 — Integrated Care-Access & Quality Support System for Rural/Underserved Healthcare**
>
> Current date: 2026-08-26

---

# 0. NON-NEGOTIABLE NAMING RULE

The project is called **Medexa**.

The following names are **NOT project names** and must not appear as the product name in new code, documentation, UI, README files, Docker service names, package metadata, presentations, or generated artifacts:

- PRAGATI
- Care Continuity
- SETOU
- Care Continuity Frontend
- Care Continuity Backend

Some of these appeared in earlier drafts, generated files, temporary directories, or architecture descriptions.

### Correct terminology

- **Medexa** = product/project name.
- **Care Continuity Layer / Care Continuity Engine** = architectural/product concept inside Medexa.
- **Referral Rescue** = core differentiating capability.
- **SIH26133** = problem-statement identifier.
- **Integrated Care-Access & Quality Support System** = official SIH problem-statement wording, not the product name.

If an old artifact says `PRAGATI` or `care-continuity-*`, treat that as historical naming that should be normalized to **Medexa** where appropriate.

Do not rename existing historical Git commits merely for naming consistency; normalize active files and future work.

---

# 1. OFFICIAL SIH26133 PROBLEM STATEMENT

Rural and underserved communities may face:

- long travel distances
- shortages of specialists
- irregular diagnostics
- fragmented medical records
- delayed referrals
- limited awareness of available services
- constrained staff and equipment at primary facilities
- patients moving between sub-centres, primary health centres, rural hospitals and district hospitals without continuity of information
- connectivity constraints
- language barriers
- health-literacy barriers
- affordability barriers

The challenge is to improve:

- timely access
- continuity
- quality
- accountability

while **strengthening — not replacing — the existing public-health system**.

The expected solution may combine:

- assisted teleconsultation
- appointment and queue management
- digital triage
- longitudinal patient records
- referral tracking
- diagnostic coordination
- medicine availability
- high-risk patient follow-up
- facility dashboards

The solution should support:

- frontline health workers
- low-connectivity environments
- multilingual interaction
- emergency escalation
- interoperable health records based on approved standards

Expected outcomes include:

- reduced travel and waiting time
- earlier consultation
- improved referral completion
- better follow-up for maternal, child and chronic conditions
- improved medicine/diagnostic availability visibility
- enhanced quality monitoring

---

# 2. THE CENTRAL STRATEGIC INSIGHT

The most important constraint is:

> **Strengthening — not replacing — the public-health system.**

Medexa is **not** another standalone healthcare app that asks ASHA workers, ANMs, PHCs, rural hospitals, or district hospitals to abandon existing processes.

Medexa is a **digital care-continuity, coordination, and recovery layer across the existing public-health network**.

Existing care chain:

```text
Sub-centre
    ↓
PHC
    ↓
Rural Hospital / CHC
    ↓
District Hospital
```

The core problem is fragmentation across:

- facilities
- people
- patient records
- referrals
- diagnostics
- connectivity conditions
- follow-up responsibilities

Medexa should make this existing chain behave more like **one continuous care journey**.

---

# 3. PRODUCT THESIS

The simplest product statement is:

> **Medexa does not stop at referral creation. It tracks the patient's care journey, detects where continuity is likely to break, triggers recovery actions, returns the outcome to the originating worker, and follows the patient until the care episode closes.**

The core journey:

```text
ASSESS
  ↓
ROUTE
  ↓
REFER
  ↓
ACKNOWLEDGE
  ↓
SCHEDULE
  ↓
CONSULT
  ↓
OUTCOME
  ↓
BACK-REFER
  ↓
FOLLOW-UP
  ↓
CLOSE
```

The system continuously surrounds this journey with:

```text
CONTINUITY ENGINE
├── SLA monitoring
├── continuity-risk detection
├── referral-failure detection
└── rescue actions
```

A strong one-line pitch:

> **Medexa is an offline-first care-continuity and recovery layer for India's public-health network that doesn't stop at referral creation — it detects where care may break, helps recover stalled referrals, returns outcomes to frontline workers, and follows the patient until the episode closes.**

---

# 4. CARE CONTINUITY IS THE UNIFYING CONCEPT

Medexa has three continuity dimensions:

### 4.1 Information continuity

Patient history, encounters, triage, observations, referrals, outcomes and follow-up information remain connected across facilities.

### 4.2 Referral continuity

A referral is not a single event. It is a stateful journey:

```text
created → sent → acknowledged → scheduled → consulted → outcome → back-referral
```

### 4.3 Follow-up continuity

The receiving facility's work must return to the originating worker/facility and generate appropriate follow-up until closure.

### Offline-first cuts across all three

Connectivity is a system constraint, not a separate module.

```text
                  SIH PROBLEM
                       ↓
              FRAGMENTED CARE
                       ↓
       ┌───────────────┼────────────────┐
       ↓               ↓                ↓
 INFORMATION       REFERRAL         FOLLOW-UP
 FRAGMENTATION     DELAYS              GAPS
       └───────────────┼────────────────┘
                       ↓
              MEDEXA CARE CONTINUITY
                    + RECOVERY
                       ↓
             FACILITY / DISTRICT
                INTELLIGENCE
                       ↓
                ACCOUNTABILITY
```

---

# 5. FEATURE GOVERNANCE — STOP SCOPE CREEP

The SIH statement says the solution **may combine** many capabilities. It is not a requirement to build every listed module.

Every new feature must pass these four questions:

1. Does it directly address the SIH problem?
2. Which stakeholder does it help — patient, frontline worker, facility staff, or district officer?
3. What measurable outcome does it improve?
4. Can we demonstrate it convincingly in the SIH demo?

If a feature fails any one of these, do not build it merely because it sounds impressive.

This is why unrelated image-based disease diagnosis is not a core Medexa feature. It introduces clinical-validation risk and is not central to the continuity workflow.

---

# 6. WHAT OUR RESEARCH DISCOVERED

We researched existing government systems, platforms, referral systems, open-source health infrastructure, and relevant literature.

Important benchmarks include:

### eSanjeevani

Government telemedicine already operates at national scale.

**Implication:** Medexa should not position itself as another telemedicine platform. Teleconsultation should be an integration/stub/optional module, not the product thesis.

### ABDM / ABHA / Health Facility Registry

India already has national digital-health infrastructure and interoperability rails.

**Implication:** Medexa should align with and build toward these standards, not claim to replace ABDM.

### RCH / ANMOL

Existing maternal/child/frontline digital workflows exist.

**Implication:** Medexa should complement existing programme systems and provide cross-program care continuity rather than duplicate them.

### NCD ecosystem

Existing NCD systems already support screening, referrals and follow-up.

**Implication:** Medexa should not become another condition-specific portal.

### CommCare / Medic / Community Health Toolkit

These already demonstrate offline-first frontline workflows, longitudinal cases, referrals, reminders, dashboards and multilingual operation.

**Implication:** “offline CHW app” is not a defensible uniqueness claim by itself.

### Closed-loop referral platforms

Other systems demonstrate referral tracking and closure.

**Implication:** “closed-loop referral” alone is not sufficiently unique.

### WHO/Karnataka referral research

Real Indian referral-system work demonstrates process/interoperability issues and the importance of feedback from receiving facilities to referring providers.

### Indian public-health review evidence

Referral and counter-referral feedback are not uniformly operationalized.

### PATH referral-strengthening evidence

Facilities can operate in isolation, communication between levels can be weak, and back-referral/patient tracking can be inadequate.

---

# 7. THE IMPORTANT GAP WE ARE TARGETING

The strongest question is not:

> “Can we create a digital referral?”

India already has referral infrastructure.

The stronger question is:

> **“What happens after the referral is created, and what happens when that journey starts to fail?”**

Medexa must answer:

- Was it acknowledged?
- Was an appointment obtained?
- Was the patient consulted?
- Was the facility overloaded?
- Was the specialist unavailable?
- Was the patient unable to travel?
- Was the referral rejected?
- Did the outcome reach the referring worker?
- Did follow-up happen?
- If the journey stalled, did anybody intervene?

That is the basis of the **Referral Rescue** concept.

---

# 8. CORE DIFFERENTIATOR 1 — REFERRAL RESCUE ENGINE

Every active referral has a continuity state.

Example:

```text
Referral #MDX-10482

Sent                 ✓
Receiving facility   ✓
Accepted             ✓
Appointment          ✓
Consultation         ?
Outcome              ?
Back-referral        ?
Follow-up            ?
```

The system should detect:

```text
NORMAL
  ↓
Referral progressing
```

or:

```text
DELAYED / AT RISK
  ↓
RESCUE ACTION
```

Possible rescue actions:

- notify referring worker
- escalate to supervisor
- create a prioritized follow-up task
- suggest another appropriate facility when the routing rules permit
- record the failure reason
- preserve the audit trail

This is **operational continuity intelligence**, not autonomous clinical diagnosis.

---

# 9. CORE DIFFERENTIATOR 2 — BACK-REFERRAL PACKET

The receiving facility should return structured outcome information:

- diagnosis/outcome
- procedures
- investigations
- treatment
- medication
- follow-up date
- warning signs
- instructions

Flow:

```text
District Hospital
       ↓
Back-referral
       ├── outcome
       ├── treatment
       ├── medication
       ├── follow-up
       └── warning signs
              ↓
          PHC / ASHA / ANM
              ↓
        continued care
```

The referral should not end at “consultation completed.”

It should end at:

> **Outcome returned + follow-up assigned + episode closed.**

---

# 10. CORE DIFFERENTIATOR 3 — CONTINUITY RISK

Keep two concepts separate.

## Clinical/Triage Risk

```text
LOW
MODERATE
HIGH
EMERGENCY
```

## Continuity Risk

```text
LOW
MEDIUM
HIGH
```

Clinical risk asks:

> “How clinically urgent is this case?”

Continuity risk asks:

> **“How likely is this patient's care journey to break, and what intervention should happen?”**

Example:

```text
Clinical risk: LOW

But:
- long travel distance
- poor connectivity
- referral not acknowledged
- appointment delayed
- previous follow-up missed

Continuity risk: HIGH
```

This is the safer and more SIH-aligned AI direction.

---

# 11. CORE DIFFERENTIATOR 4 — FACILITY-AWARE ROUTING

Do not simply show the nearest facility.

Routing should eventually consider:

```text
Clinical capability
       +
Service availability
       +
Current capacity
       +
Specialist availability
       +
Diagnostic availability
       +
Travel distance/burden
       +
Connectivity/logistics
       +
Patient constraints
```

Then recommend appropriate facility options.

This can simultaneously attack:

- long travel
- specialist shortage
- irregular diagnostics
- facility constraints
- affordability/travel burden
- lack of service awareness

This is a later P1 feature; do not build it before the core referral lifecycle is stable.

---

# 12. CORE DIFFERENTIATOR 5 — CONTINUITY SLA

Referral progression should have expected time windows.

Example:

```text
Acknowledgement < 6h
Appointment     < 48h
Consultation    < 72h
Back-referral   < 24h
Follow-up       < 7d
```

The exact SLA values should be configurable and treated as demo/business rules, not clinical guidelines unless supported by an authoritative source.

Dashboard example:

```text
Continuity SLA

82% within SLA

At risk: 103
Breached: 41

Top bottleneck:
District Hospital B

Average acknowledgement: 19.4h
```

The dashboard therefore becomes a **health-system intervention tool**, not a reporting page.

---

# 13. CORE DIFFERENTIATOR 6 — REFERRAL FAILURE INTELLIGENCE

Do not only store:

```text
Referral = FAILED
```

Store the reason:

```text
- facility full
- specialist unavailable
- patient could not travel
- connectivity failure
- appointment unavailable
- patient no-show
- cost/travel barrier
- referral rejected
- wrong facility
- other
```

Aggregate this to identify structural bottlenecks.

Example:

```text
WHY ARE REFERRALS FAILING?

32% appointment unavailable
24% patient travel barrier
18% facility capacity
14% specialist unavailable
 7% connectivity
 5% other
```

This helps the district officer understand **where the system is failing**, rather than merely counting cases.

---

# 14. CORE MVP — WHAT MUST ACTUALLY WORK

## P0 — Must build

1. Patient
2. Care Episode
3. Offline triage
4. Longitudinal history
5. Referral creation
6. Referral state machine
7. Offline outbox/sync
8. Conflict visibility
9. Referral SLA tracking
10. Referral failure reasons
11. Referral Rescue workflow
12. Back-referral/outcome packet
13. Follow-up task
14. District/facility continuity dashboard
15. RBAC
16. Audit trail

## P1 — Strong differentiators

17. Facility-aware routing
18. Continuity-risk scoring
19. Facility bottleneck analytics
20. Emergency escalation
21. Multilingual support through a replaceable provider adapter

## P2 — Only after P0/P1 are stable

22. Teleconsultation integration/stub
23. SMS/IVR reminders
24. More sophisticated ML
25. Full ABDM integration/onboarding
26. Additional diagnostics/medicine modules

Do not allow P2 work to destabilize P0.

---

# 15. CORE DATA MODEL

The current backend scaffold already has a useful base:

```text
Patient
CareEpisode
Encounter
TriageAssessment
Observation
Referral
ReferralStateTransition
Facility
User
AuditLog
```

The target domain model is:

```text
CareEpisode
│
├── Patient
├── Encounter(s)
├── Triage
├── Observation(s)
├── Referral
│   ├── State history
│   ├── SLA
│   ├── Failure reason
│   └── Rescue actions
├── Consultation
├── Diagnostic
├── Treatment / Outcome
├── BackReferral
├── FollowUp
└── Closure
```

Required future entities/concepts:

```text
ReferralSLA
ReferralRisk
ReferralRescueAction
ReferralFailureReason
Consultation
Diagnostic
CareOutcome
BackReferral
FollowUpTask
```

---

# 16. CLINICAL RISK VS CONTINUITY RISK — HARD RULE

Never silently merge these two.

Clinical triage risk is about the patient's immediate clinical situation.

Continuity risk is about the probability of failure in the care pathway.

The UI and API should name these separately.

The AI should not make unsupported diagnoses.

Preferred output:

```json
{
  "risk_score": 0.81,
  "risk_level": "HIGH",
  "reasons": [
    "Referral not acknowledged within SLA",
    "Previous follow-up missed",
    "Receiving facility currently overloaded"
  ],
  "recommended_action": "Escalate referral"
}
```

The system should be explainable: every risk score should have contributing factors and an operational recommendation.

---

# 17. SYNC ARCHITECTURE — OFFLINE FIRST IS REAL, NOT A SLIDE

Frontend local-first path:

```text
User action
   ↓
Zod validation
   ↓
Dexie transaction
   ↓
Outbox mutation
   ↓
UI immediately reflects local state
   ↓
Connectivity returns
   ↓
Sync engine
   ↓
API
   ↓
idempotent server mutation
   ↓
success / conflict
```

Outbox mutation should conceptually contain:

```text
mutationId
entityId
entityType
operation
payload
schemaVersion
deviceId
clientTimestamp
attemptCount
status
```

Do not rely only on timestamps.

### State transitions are not ordinary last-write-wins documents

For referral state transitions:

```text
client A: ACCEPTED → CONSULTED
client B: ACCEPTED → PATIENT_NO_SHOW
```

The server must validate both against authoritative state and preserve the attempted mutation/audit information.

A 409 Conflict is not enough. The frontend must surface the conflict and provide a recovery path.

Last-write-wins may be acceptable for selected ordinary profile fields, but **not for authoritative referral state transitions**.

---

# 18. API CONTRACT — SINGLE SOURCE OF TRUTH

Do not create three independent definitions of the same API contract.

Correct direction:

```text
Pydantic schemas
      ↓
FastAPI OpenAPI
      ↓
openapi-typescript
      ↓
Frontend generated API types
```

Frontend Zod should be used for runtime/client/offline validation where useful, but should not silently become a competing authoritative API definition.

The backend OpenAPI contract is authoritative for API shapes.

---

# 19. FHIR / ABDM POSITIONING

Do not claim that internal SQLAlchemy tables are automatically “FHIR compliant.”

Correct architecture:

```text
Medexa internal domain model
        ↓
FHIR mapping / adapter
        ↓
FHIR resources
        ↓
ABDM interoperability layer later
```

FHIR alignment should guide naming and relationships where useful, but do not force the internal database to become a copy of FHIR.

Full production ABDM integration/onboarding is explicitly out of scope for the hackathon unless time and access make it feasible.

The pitch should say:

> **Designed toward approved interoperability standards; formal government onboarding/integration is a future phase.**

---

# 20. TECH STACK — CURRENT DECISION

## Frontend

- React
- TypeScript
- Vite
- React Router
- Zod
- Dexie.js
- vite-plugin-pwa
- Vitest
- openapi-typescript

## Backend

- FastAPI
- Python
- Pydantic v2
- SQLAlchemy 2.x async
- Alembic
- PostgreSQL
- Pytest
- JWT/RBAC

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL container

Optional later:

- Redis only if a demonstrated queue/cache requirement emerges
- Bhashini through a provider adapter
- teleconsultation through an integration adapter

### Third-party independence principle

Keep the core system functional without external AI/vendor APIs.

External providers should be replaceable adapters.

Examples:

```text
MultilingualProvider
   ├── BhashiniAdapter
   └── future adapter

TeleconsultProvider
   ├── demo adapter
   └── future provider

NotificationProvider
   ├── local/demo
   └── SMS/IVR provider
```

The core referral, offline sync, care episode, risk rules, dashboard, and data model must not depend on ElevenLabs, Bhashini, OpenAI, or another vendor to function.

ElevenLabs was discussed as a possible future voice layer, but it is **not part of the core architecture yet**.

---

# 21. FRONTEND STATUS / DECISIONS

The frontend is being handled separately from the backend.

Current repository structure is intended to include:

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── referral/
│   │   └── triage/
│   ├── generated/
│   ├── hooks/
│   ├── models/
│   ├── pages/
│   ├── sync/
│   ├── utils/
│   └── styles/
└── ...
```

Existing important frontend concepts include:

- `TriageForm`
- `SyncIndicator`
- `ReferralTracker`
- `CreateReferralForm`
- `FacilityContinuityTable`
- `ReferralContinuitySummary`
- `DistrictDashboardPage`
- `PatientEpisodePage`
- `useCareEpisode`
- `useFacilityPathway`
- `useSyncStatus`
- Dexie DB
- sync engine
- continuity risk engine

The frontend already had a dependency-hardening pass:

- Vite upgraded to 6.4.3
- vite-plugin-pwa upgraded to 0.21.1
- Vitest upgraded to 4.1.11
- React Router upgraded to 7.18.2
- uuid upgraded to 14.0.2
- `@types/uuid` removed
- `npm audit` reached **0 vulnerabilities**

A current TypeScript build error was identified in `TriageForm.tsx`: `TriageRiskLevel` was imported but unused. This should be corrected without deleting the actual risk-level schema from `careEpisode.ts`.

The alias configuration uses:

```json
"paths": {
  "@/*": ["src/*"]
}
```

Vite must also have a corresponding `resolve.alias` configuration for runtime imports. The project previously showed Vite failing to resolve `@/App` and `@/sync/syncEngine`; this must be fixed in `vite.config.ts` rather than replacing imports everywhere.

---

# 22. BACKEND SCAFFOLD RECEIVED FROM CLAUDE — STATUS

A Claude-generated backend ZIP was received and reviewed.

It is a **strong scaffold, not merge-ready final architecture**.

The useful existing pieces to preserve are:

- Patient model
- CareEpisode model
- Encounter model
- Observation model
- Triage model/schema
- Referral model
- Referral state machine
- ReferralStateTransition/audit history
- Facility model
- User/RBAC foundations
- AuditLog
- FastAPI routers
- Pydantic schemas
- SQLAlchemy/Alembic setup
- dashboard aggregation service
- rule-based risk engine
- Pytest tests
- seed/demo data

The major improvements required are:

1. Add Consultation/Diagnostic/Treatment Outcome/BackReferral/FollowUp concepts.
2. Add Referral SLA.
3. Add Referral Failure Reason.
4. Add Referral Rescue Action.
5. Separate clinical risk from continuity risk.
6. Make conflict handling recoverable, not just a 409 response.
7. Use Pydantic/OpenAPI → generated TypeScript as the API contract.
8. Harden Docker/secrets/migrations.
9. Add explicit sync mutation identity/idempotency.
10. Avoid claiming internal tables are automatically FHIR-compliant.

Do not wholesale replace the frontend or architecture with the Claude scaffold.

---

# 23. DOCKER / LOCAL DEVELOPMENT RULES

Docker Compose is intended to provide reproducible development.

Target:

```text
docker compose up
```

should eventually produce:

```text
PostgreSQL   ✓
FastAPI      ✓
Frontend     ✓
```

The current supplied Compose file is a useful starting point but needs hardening.

### Required improvements

- move database/JWT secrets to `.env`
- commit only `.env.example`
- generate a real JWT secret for local environments
- verify backend healthcheck works with the backend image
- verify frontend Dockerfile exists and works
- separate migration creation from migration application
- use `alembic upgrade head` for applying existing migrations
- do not autogenerate migrations automatically at runtime
- verify service readiness and networking

Migration workflow:

```text
change model
   ↓
alembic revision --autogenerate
   ↓
review migration
   ↓
commit migration
```

Normal startup:

```text
pull
  ↓
docker compose up
  ↓
alembic upgrade head
  ↓
run application
```

---

# 24. SECURITY / PRIVACY RULES

This is health-related software.

For the hackathon:

- use synthetic/demo data only
- never put real patient data in GitHub
- never commit `.env`
- use role-based access
- maintain audit logs
- minimize exposed patient information
- keep secrets outside source control
- make the demo explicitly privacy-by-design

The system is a prototype, not a production medical device or government health-data deployment.

Do not make clinical claims that exceed the implemented evidence.

---

# 25. TEAM STRUCTURE

Team members:

- **Debasmita**
- **Debargha**
- **Souvik**
- **Meghanta**
- **Debanjan** — project lead / coordinating implementation

All team members are heavily AI-assisted and can learn with structured guidance. They have GitHub accounts.

The team should be split by independently deliverable sections, but everyone must understand the end-to-end Care Journey.

Recommended ownership:

### Frontend team

Build the user-facing workflows:

- frontline worker experience
- patient/care episode pages
- triage
- referral creation/tracking
- sync indicator/conflict UX
- facility/district dashboards

### Backend lead

Build/coordinate:

- domain model
- API
- referral state machine
- sync/idempotency
- RBAC
- audit
- risk services
- database/migrations

### Integration/data/AI work

Build:

- continuity risk logic
- facility routing data
- SLA analytics
- failure-reason analytics
- future provider adapters

Ownership can overlap, but PRs should remain small and independently reviewable.

---

# 26. TARGET FRONTEND PAGES

The exact UI can evolve, but the MVP should revolve around workflows rather than dozens of screens.

Core pages:

1. Login / role selection for demo
2. Frontline worker dashboard
3. Patient search/list
4. Patient/Care Episode detail
5. New triage
6. Referral creation
7. Referral tracker/detail
8. Follow-up queue
9. Facility operations view
10. District continuity dashboard

Additional modal/drawer components can handle:

- back-referral packet
- rescue action
- conflict resolution
- referral failure reason
- sync history

Do not build many independent pages just to increase page count.

---

# 27. DASHBOARDS

## Frontline worker dashboard

Answers:

> Who needs attention now?

Show:

- active care episodes
- high continuity-risk patients
- overdue follow-ups
- stalled referrals
- sync status

## Facility dashboard

Answers:

> What is happening inside this facility?

Show:

- incoming referrals
- queue/load
- pending acknowledgements
- consultations due
- outgoing/back-referrals
- SLA breaches

## District dashboard

Answers:

> Where is the healthcare network breaking?

Show:

- referral funnel
- SLA performance
- facility bottlenecks
- failure reasons
- capacity/service availability
- continuity-risk distribution
- follow-up compliance
- data freshness/sync lag

The district dashboard is the **quality/accountability arm of the Care Continuity Engine**, not a generic reporting dashboard.

---

# 28. TESTING STRATEGY

## Frontend

Vitest should cover:

- triage validation
- continuity-risk logic
- referral state UI rules
- outbox behavior
- sync success/failure
- conflict state

## Backend

Pytest should cover:

- referral transition invariants
- illegal transitions
- idempotency
- RBAC
- audit events
- SLA calculations
- risk engine
- rescue conditions
- API validation

Important judge question:

> “What happens if two people edit the same referral offline?”

Answer must be an implemented, tested workflow.

---

# 29. ROADMAP

## Phase 0 — Repository baseline

- GitHub repository
- main branch
- feature branches
- root `.gitignore`
- frontend baseline
- canonical docs

## Phase 1 — Full local stack

- frontend
- FastAPI
- PostgreSQL
- Docker Compose
- healthchecks

## Phase 2 — Contract + data model

- Pydantic schemas
- OpenAPI
- generated TS types
- SQLAlchemy models
- Alembic

## Phase 3 — Core care journey

- patient
- care episode
- triage
- history
- referral creation

## Phase 4 — Offline-first

- Dexie
- outbox
- sync engine
- idempotency
- conflict UX
- airplane-mode demo

## Phase 5 — Referral continuity

- state machine
- SLA
- failure reasons
- rescue actions
- back-referral
- follow-up

## Phase 6 — Intelligence

- continuity risk
- explainable factors
- facility bottleneck analysis
- facility-aware routing

## Phase 7 — Governance + polish

- dashboards
- audit
- data freshness
- accessibility
- multilingual adapter

## Phase 8 — Stretch

- teleconsultation adapter
- SMS/IVR
- deeper ML
- ABDM integration if feasible

---

# 30. THE KILLER SIH DEMO

Do not demo ten disconnected features.

Follow one patient.

### Act 1 — Village / frontline

ASHA/ANM opens Medexa.

Network is unavailable.

She enters:

- patient
- symptoms
- vitals
- triage

Medexa calculates clinical triage risk and continuity indicators.

### Act 2 — Referral

Referral is created offline.

The worker can continue using the app.

Visible sync status:

```text
Saved locally
Waiting for connection
```

### Act 3 — Connectivity returns

Sync occurs.

Backend receives the mutation.

Referral appears at the receiving facility.

### Act 4 — Referral Rescue

Artificially demonstrate a stalled acknowledgement/appointment.

Medexa shows:

```text
Referral at risk
Reason: acknowledgement SLA breached
Action: escalate to facility/supervisor
```

### Act 5 — Consultation + back-referral

Receiving facility records outcome.

Back-referral packet returns to originating worker.

Follow-up task is created.

### Act 6 — District intelligence

District dashboard shows the bottleneck and failure reason.

Final message:

> **“We are not replacing the public-health system. We are making the existing care journey visible, connected, recoverable, and accountable.”**

---

# 31. METRICS

Every major feature must connect to a measurable outcome.

Recommended prototype metrics:

### Access

- estimated travel burden
- waiting time
- time to consultation

### Referral continuity

- acknowledgement rate
- referral completion rate
- SLA compliance
- stalled referral count
- back-referral completion

### Follow-up

- overdue follow-up rate
- follow-up completion
- high-risk follow-up coverage

### System quality

- facility bottleneck count
- failure reasons
- data freshness
- sync success rate
- conflict rate

### Demo metric

- offline save → successful sync

Do not invent real-world improvement percentages without evidence. Use measured prototype metrics or clearly label simulated/demo data.

---

# 32. WHAT WE MUST NOT CLAIM

Do not claim:

- “Nobody has built this before.”
- “AI diagnoses diseases.”
- “We are replacing government health infrastructure.”
- “We are ABDM compliant” unless the relevant integration and compliance requirements are actually met.
- “FHIR compliant” merely because tables resemble FHIR resources.
- “Production-ready government deployment.”
- “Real-time rural healthcare everywhere.”

Better claims:

- “offline-first prototype”
- “designed toward interoperability standards”
- “explainable continuity-risk prioritization”
- “referral recovery workflow”
- “back-referral and follow-up continuity”
- “prototype facility/district intelligence”

---

# 33. WHY MEDEXA CAN BE COMPETITIVE

The project is not trying to win by feature count.

It wins if it demonstrates that the team understands the **system failure** behind the problem statement.

The narrative is:

```text
Existing systems already provide pieces:
telemedicine + records + referrals + programme portals

             BUT

care can still fragment between facilities.

             ↓

MEDEXA adds a coordination + recovery layer.

             ↓

ROUTE → TRACK → DETECT FAILURE → RESCUE → RETURN OUTCOME → FOLLOW UP → CLOSE
```

The defensible differentiation is therefore the **combination and workflow integration**, especially:

- referral SLA
- continuity-risk prioritization
- rescue actions
- back-referral packet
- failure-reason intelligence
- offline operation
- facility/district intervention visibility

not any single one of these features in isolation.

---

# 34. AI RULES

AI should be useful, explainable, and subordinate to the care workflow.

Good AI/ML uses:

- continuity-risk prioritization
- follow-up/no-show risk
- facility bottleneck prediction
- routing assistance
- multilingual assistance

Bad core use:

- autonomous diagnosis
- image disease detection unrelated to referral continuity
- opaque clinical decisions

Start rule-based.

Only introduce ML when the core workflow is stable and there is a credible dataset/evaluation plan.

For hackathon purposes, an explainable rules engine is preferable to a fake “AI” model with no validation.

---

# 35. CURRENT IMMEDIATE NEXT STEPS

Do these in order.

### Step 1

Normalize project naming to **Medexa** in active documentation/code/package metadata.

### Step 2

Keep the current frontend branch intact.

### Step 3

Bring the Claude backend into a separate backend branch; do not merge directly into `main`.

### Step 4

Run the backend scaffold and inspect:

- models
- migrations
- routes
- tests
- auth
- seed data
- Docker

### Step 5

Fix the frontend Vite alias/runtime issue and TypeScript error.

### Step 6

Connect backend OpenAPI → openapi-typescript → frontend generated types.

### Step 7

Implement the vertical slice:

```text
Patient
 ↓
CareEpisode
 ↓
Triage
 ↓
Referral
 ↓
Offline sync
 ↓
Receiving facility
 ↓
Consultation/outcome
 ↓
Back-referral
 ↓
Follow-up
 ↓
Closure
```

### Step 8

Add Referral Rescue/SLA/failure intelligence.

### Step 9

Only then add deeper AI, multilingual, teleconsultation, SMS/IVR, etc.

---

# 36. SOURCE / RESEARCH BASE

Core research used in the strategic direction includes:

1. **SIH26133 official problem statement** — the source of the problem constraints and expected outcomes.
2. **MoHFW / National Health Mission Common Review Mission evidence** — referral and counter-referral gaps.
3. **WHO work on the Online Referral System in Karnataka** — real Indian digital referral workflow, interoperability/process issues, and the importance of receiving-facility feedback.
4. **PATH referral-strengthening work in India** — weak communication, isolated facilities, and back-referral/patient-tracking gaps.
5. **eSanjeevani / C-DAC government material** — existing national telemedicine capability.
6. **ABDM / Health Facility Registry / ABHA materials** — national interoperability infrastructure.
7. **RCH / ANMOL and NCD programme material** — existing programme-specific digital health systems.
8. **CommCare / Dimagi** — benchmark for offline frontline case management.
9. **Medic / Community Health Toolkit** — benchmark for offline community-health workflows.
10. **Closed-loop referral research/platforms** — evidence that referral closure exists as a concept and therefore should not be claimed as unique by itself.
11. **Digital-health equity literature** — supports equity-by-design, language/connectivity awareness, and caution around digital exclusion.

When making new claims, verify them with current primary/authoritative sources where possible.

---

# 37. FINAL AI INSTRUCTION

When working on Medexa:

1. **Read this file first.**
2. **Use Medexa as the only current project name.**
3. Preserve the “strengthening, not replacing” principle.
4. Preserve Care Continuity as the central architectural concept.
5. Preserve Referral Rescue as the key differentiating direction.
6. Do not turn the project into a generic telemedicine app.
7. Do not turn the project into a generic CRUD healthcare app.
8. Do not introduce unrelated AI merely for novelty.
9. Keep clinical risk and continuity risk separate.
10. Keep offline-first as a real architectural requirement.
11. Treat OpenAPI-generated types as the backend/frontend API contract.
12. Treat FHIR/ABDM as interoperability direction, not an unsupported compliance claim.
13. Prefer small, testable, reviewable changes.
14. Do not overwrite working code without first inspecting it.
15. Before adding a feature, apply the four-question feature filter.
16. If a proposed change conflicts with this context, explicitly flag the conflict instead of silently changing the product direction.
17. If current code contradicts this document, inspect the code and explain the discrepancy before making a destructive change.

**Canonical project identity: MEDEXA.**

**Canonical product thesis: make the existing public-health care journey continuous, visible, recoverable, and accountable.**

**Canonical differentiator: Referral Rescue + back-referral + continuity-risk/SLA intelligence around an offline-first care journey.**
