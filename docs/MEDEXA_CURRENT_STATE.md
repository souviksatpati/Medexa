# Medexa Frontend — Current State & Real Architecture Documentation

**Document Status**: Authoritative / Ground Truth  
**Audit Date**: September 2026 (Reflected to codebase commit state)  
**Target Path**: `docs/MEDEXA_CURRENT_STATE.md`  
**Purpose**: Complete, factual documentation of how the Medexa application actually functions in code right now. Every section has been verified directly against active source files in `frontend/src`.

---

## 1. Executive Summary & Core Mission

Medexa is an offline-first clinical decision support and care-continuity referral network designed for India's public health ecosystem. Its primary operational mandate is to bridge the systemic gap between rural community frontline workers (**ASHAs**), secondary sub-district care (**Block PHCs/CHCs**), and tertiary medical centers (**District Hospitals**).

### Realized Architecture vs. Original Conception
* **Original Plan**: A single, homogeneous Dexie.js (IndexedDB) database acting as the local database for all entities (patients, care episodes, triage records, referrals), synchronizing to an external backend via a single unified sync engine.
* **Actual Codebase Reality**: The codebase currently operates on a **dual-track persistence model**:
  1. **Dexie.js (`care-continuity-db`)**: Persists clinical data (`patients`, `careEpisodes`, `triageAssessments`, and a sync queue). Used by the Care Episode and Digital Triage sub-components.
  2. **Zustand + `localStorage` (`medexa_unified_referrals_v5`)**: Manages the end-to-end multi-tier referral life-cycle (`UnifiedReferral`), dynamic role scoping, facility admissions, escalation, and back-referral loops across the three operational dashboards.
  *(Note: Differs from original plan, where referrals were intended to reside solely in Dexie tables alongside clinical episodes.)*

---

## 2. Technology Stack & Runtime Dependencies

The application is built as a Single Page Application (SPA) with Progressive Web App (PWA) offline capabilities.

| Layer | Technology | Version | Notes / Real Implementation Details |
|---|---|---|---|
| **Core Framework** | React | `^18.3.1` | Functional components, Hooks, StrictMode |
| **Language** | TypeScript | `^5.5.3` | Strict type definitions in `src/models/` and `src/auth/` |
| **Build Tool & Bundler** | Vite | `^5.4.2` | Dev server on port 5173 with custom mock API middleware |
| **Styling** | Tailwind CSS | `^3.4.1` | Custom color tokens (`primary`, `surface`, `on-surface`, etc.) |
| **Routing** | React Router DOM | `^6.26.2` | Client-side routing with role-based route guards |
| **State Management** | Zustand | `^4.5.5` | Used for `useAuth`, `useReferralStore`, and `useLanguageStore` |
| **Local Database** | Dexie.js | `^4.0.8` | IndexedDB wrapper for offline clinical records (`db.ts`) |
| **Data Validation** | Zod | `^3.23.8` | Schema validation for Auth, Care Episodes, Referrals, Triage |
| **PWA & Service Worker** | `vite-plugin-pwa` | `^0.20.5` | Workbox runtime caching for `/api/` (NetworkFirst) |
| **Iconography** | Google Material Symbols | CDN | Material Symbols Outlined loaded in `index.html` |
| **Utilities** | UUID (`uuid`) | `^10.0.0` | Unique ID generation for triage records and sync payloads |

---

## 3. Complete Routing Table & Navigation Graph

All routes are defined in `frontend/src/App.tsx`. Access control is governed by `ProtectedRoute.tsx`.

### 3.1 Public & Utility Routes

| Route URL | Component | Access | Purpose |
|---|---|---|---|
| `/` | `HomePage` | Public | Public landing page explaining Medexa, quick role links, and features. |
| `/login` | `LoginPage` | Public | Portal-specific or general login. Accepts query parameter `?portal=ASHA\|BLOCK\|DISTRICT`. |
| `/portal-select` | `PortalSelectPage` | Public | Visual portal chooser redirecting to respective dashboards or `/login`. |
| `/triage` | `DigitalTriagePage` | Public | Standalone clinical digital triage calculator and patient intake. |
| `/episode/:careEpisodeId` | `PatientEpisodePage` | Public | Longitudinal patient episode viewer querying Dexie for patient and episode records. |
| `/referral-tracker` | `ReferralTrackerPage` | Public | Search-by-ID referral lookup with step progression visualization. |
| `/facilities` | `FacilitiesPage` | Public | Regional facility directory (Directory of DH, CHC, PHC, Sub-centers). |
| `/doctor-availability` | `DoctorAvailabilityPage` | Public (Sidebar) | Real-time duty roster and specialist coverage by facility. |
| `/medicine-availability` | `MedicineAvailabilityPage` | Public (Sidebar) | Pharmacy stock and inventory tracker across tiers. |
| `/diagnostics` | `DiagnosticsPage` | Public (Sidebar) | Lab test availability, operational status, and waiting times. |
| `/high-risk-follow-up`| `HighRiskFollowUpPage` | Public (Sidebar) | Clinical queue for overdue, scheduled, and high-risk patients. |
| `/reports` | `ReportsPage` | Public (Sidebar) | Administrative monthly referral volumes and facility analytics. |
| `*` | Redirection to `/` | Public | Catch-all redirecting unknown URLs back to home. |

### 3.2 Protected Operational Routes

Protected routes require an authenticated session in `useAuth`. If unauthenticated, the user is redirected to `/login?portal=<ROLE>&redirect=<TARGET>`.

| Route URL | Component | Required Role(s) | Operational Function |
|---|---|---|---|
| `/dashboard` | Dynamic Redirector | Any valid role | Evaluates `user.role` and redirects: `ASHA` -> `/asha`, `BLOCK` -> `/rural-office`, `DISTRICT` -> `/district-office`, others -> `/`. |
| `/asha` | `AshaReferralPage` | `ASHA`, `SUPER_ADMIN` | Village frontline portal: Care Episode assessment, referral creation, village queue. |
| `/rural-office` | `RuralOfficeDashboardPage`| `BLOCK`, `SUPER_ADMIN` | Sub-district coordination: review incoming village cases, assign doctors, escalate to District. |
| `/district-office` | `DistrictOfficePage` | `DISTRICT`, `SUPER_ADMIN`| Tertiary hospital command: clinical admission, bed allocation, specialist consult, back-referral. |
| `/referrals/:referralId` | `ReferralDetailsPage` | Any authenticated role | Deep-link detail view for an individual referral record with timeline and clinical actions. |

### 3.3 Decommissioned / Orphaned Code Artifacts
* **`ReferralsPage.tsx`**: Legacy unified table view; commented out in `App.tsx` and replaced by role-specific dashboards (`/asha`, `/rural-office`, `/district-office`).
* **`souvik.tsx`**: An empty placeholder file located in `src/pages/` (0 bytes); unused.
* **`FacilitiesPage.tsx`**: Preserved in router and source, but navigation links were removed from the District Sidebar during earlier UI consolidations.

---

## 4. Authentication, RBAC & Identity Architecture

Medexa implements role-based access control (RBAC) designed around India’s public healthcare administrative hierarchy.

### 4.1 Dual Authentication Stores (Coexisting in Code)
1. **Primary Session Store (`src/auth/auth.ts`)**:
   - Backed by Zustand and synced to `localStorage` key: `"medexa_auth_user"`.
   - Used by `ProtectedRoute.tsx`, `App.tsx`, `DashboardSidebar.tsx`, and `LoginPage.tsx`.
   - Validates logins against `HEALTH_REGISTRY_DATABASE`, a hardcoded national registry of 15 verified credentials across West Bengal, Bihar, Jharkhand, Odisha, and Assam.
   - Enforces password matching against role-specific patterns (e.g., `asha@123`, `block@123`, `dist@123`, `admin@123`).
2. **Legacy / Portal Adapter Store (`src/sync/referralAuth.ts`)**:
   - Manages role tokens in `localStorage`: `"medexa_asha_session"`, `"medexa_block_session"`, `"medexa_district_session"`.
   - Contains a separate credential table (`CREDENTIALS_DB`) with default mock users (`asha_joypur_01`, `bmoh_belur_01`, `msvp_bankura_01`).
   - Used inside the operational pages (`AshaReferralPage.tsx`, `RuralOfficeDashboardPage.tsx`, `DistrictOfficePage.tsx`) for secondary login modal fallbacks.
   *(Note: Differs from original plan, which intended a single centralized token-based auth mechanism.)*

### 4.2 Healthcare Hierarchy Roles & Pre-configured Credentials

| Role | Hierarchy Level | Primary Operational Scope | Demo Registry Username | Demo Password |
|---|---|---|---|---|
| **`ASHA`** | Village / Community | Assigned Village (e.g. Rampur, Sonamukhi East) | `ASHA-WB-401` | `asha@123` |
| **`BLOCK`** | Sub-District (PHC/CHC)| Assigned Block (e.g. Joypur Block) | `BMOH-WB-201` | `block@123` |
| **`DISTRICT`** | Tertiary District Hospital| Assigned District (e.g. Bankura District) | `MSVP-WB-101` | `dist@123` |
| **`STATE`** | State Health Directorate | Entire State (e.g. West Bengal) | `DHS-WB-001` | `admin@123` |
| **`SUPER_ADMIN`**| MoHFW National Command| National Health Network | `ADMIN-NAT-001` | `admin@123` |

---

## 5. Dual Data Persistence & State Model

Medexa's persistence layer is split between IndexedDB (Dexie) and `localStorage`.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 MEDEXA FRONTEND DATA                   │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
               ┌─────────────────────────────┴────────────────────────────┐
               ▼                                                          ▼
  TRACK A: Dexie IndexedDB                                   TRACK B: Zustand Store
  (Database: care-continuity-db)                             (localStorage: medexa_unified_referrals_v5)
  ────────────────────────────────                           ────────────────────────────────────────────
  • patients                                                 • UnifiedReferral objects (full lifecycle)
  • careEpisodes                                             • getRoleScopedReferrals() isolation
  • triageAssessments                                        • addAshaReferral()
  • syncQueue                                                • addBlockReferral()
  • writeAndQueue() transactional engine                     • escalateToDistrict()
  • syncEngine.ts HTTP dispatcher                            • admitDistrictPatient()
                                                             • backReferPatient()
```

### 5.1 Track A: Dexie IndexedDB (`care-continuity-db`)
Defined in `frontend/src/sync/db.ts`:
* **Schema Version 1**:
  - `patients`: `id, fullName, villageOrWard, phone, createdAt`
  - `careEpisodes`: `id, patientId, status, openedAt, syncStatus`
  - `triageAssessments`: `id, careEpisodeId, performedBy, performedAt, clinicalRiskLevel, syncStatus`
  - `referrals`: `id, careEpisodeId, urgency, targetFacilityId, status, syncStatus`
  - `referralTransitions`: `id, referralId, fromStatus, toStatus, transitionedAt, syncStatus`
  - `syncQueue`: `++id, entity, entityId, operation, queuedAt, attempts`
* **Transactional Write-and-Queue**:
  The `writeAndQueue<T>` helper executes a transactional write: it inserts or updates the target entity in IndexedDB and simultaneously writes a queue entry into `db.syncQueue` with `attempts: 0`.
* **Sync Engine (`syncEngine.ts`)**:
  - Monitors `navigator.onLine` and window `"online"` events; polls every 30 seconds.
  - Flushes `db.syncQueue` sequentially (oldest-queued-first) to API endpoints (`/patients`, `/care-episodes`, `/triage`, `/referrals`).
  - Marks entities with `syncStatus: "synced"` upon server acknowledgement.
  - Retries up to 5 times (`MAX_ATTEMPTS`) with backoff before flagging errors.
* **Initial Demo Seeding (`seedDemoData.ts`)**:
  - Seeds 3 demo patients (`Rahul Sharma`, `Sunita Mahato`, `Anita Sharma`).
  - Seeds 3 demo care episodes.
  - Seeds 1 demo triage assessment (`550e8400-e29b-41d4-a716-446655440099`) for Rahul Sharma.

### 5.2 Track B: Unified Referral Store (`referralStore.ts`)
Defined in `frontend/src/sync/referralStore.ts`:
* **Storage Key**: `medexa_unified_referrals_v5` in browser `localStorage`.
* **Default Seed Data**: 12 pre-loaded referral records across West Bengal, Bihar, and Jharkhand with realistic clinical timelines, ambulance dispatches, triage tiers, and follow-up notes.
* **Primary Store Actions**:
  - `addAshaReferral(referral)`: Generates ID (`REF-WB-yyyy-xxxx`), sets status `"Referred to Block"`, stamps current timestamp, updates `localStorage`.
  - `addBlockReferral(referral)`: Generates ID (`BLK-REF-yyyy-xxxx`), sets status `"Escalated to District"`, target `"DISTRICT_OFFICE"`.
  - `escalateToDistrict(id, hospital, doctor, transport, notes)`: Updates status to `"Escalated to District"`, target to `"DISTRICT_OFFICE"`, logs timestamped clinical note.
  - `admitDistrictPatient(id, doctor, ward, notes)`: Updates status to `"In Consultation"`, stamps admission ward, appends notes.
  - `backReferPatient(id, notes, followUpDays)`: Sets status to `"Back-Referred"`, target back to `"BLOCK_OFFICE"`, records ASHA home-care instructions.

### 5.3 Strict Role-Based Scope Filtering (`getRoleScopedReferrals`)
To prevent data leakage across administrative tiers, `referralStore.ts` filters records dynamically according to the authenticated user's profile:
1. **`ASHA`**: Only sees referrals matching their specific assigned village (e.g., `"Rampur Village"`), or cases assigned directly to their ASHA name/worker ID. Also includes any referrals marked `"Back-Referred"` targeted to their village.
2. **`BLOCK`**: Sees all village referrals within their Block (e.g., `"Joypur Block"`), referrals targeting their Block facility (`toFacility`), or referrals created by their Block office (`sourceLevel === "BLOCK"`).
3. **`DISTRICT`**: Sees all referrals originating within their District (e.g., `"Bankura"`), or directed to their District hospital (`toFacility`).
4. **`STATE` / `SUPER_ADMIN`**: Global visibility across all records.

---

## 6. End-to-End Clinical Referral Lifecycle

The complete referral journey moves across four clinical and administrative phases:

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 1. VILLAGE TIER (ASHA Frontline)                                            │
  │    • Digital Triage: Symptoms & vitals evaluated via clinicalRiskEngine.     │
  │    • Care Episode: Stepper advances (Assessment -> Referral -> Follow-up).  │
  │    • Status: "Referred to Block" | Priority: Normal / High / Emergency     │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Escort / 108 Ambulance Dispatch
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 2. SUB-DISTRICT TIER (Block PHC / CHC)                                      │
  │    • Queue Review: Scoped intake of village cases.                          │
  │    • Clinical Evaluation: Block Medical Officer consultation.                │
  │    • Decision: Treat locally OR Escalate.                                   │
  │    • Status: "Escalated to District" | Target: "DISTRICT_OFFICE"            │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Critical Care ALS Ambulance
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 3. TERTIARY TIER (District Hospital)                                        │
  │    • Intake & Bed Assignment: ICU / Specialist Ward.                        │
  │    • Action: Admit patient (`admitDistrictPatient`).                        │
  │    • Status: "In Consultation"                                              │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Patient Stabilized / Discharged
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 4. BACK-REFERRAL & RECOVERY LOOP (Village Level)                            │
  │    • Discharge Order: Specialist inputs follow-up instructions (e.g. 3 days)│
  │    • Action: `backReferPatient` executed.                                   │
  │    • Status: "Back-Referred" | Target: "BLOCK_OFFICE"                       │
  │    • ASHA Alert Triggered: "Action Required: Conduct home visit within 48h" │
  │    • Closed Loop: ASHA conducts visit, registers completed recovery.        │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Clinical Risk & Digital Triage Scoring Engine

Located in `frontend/src/utils/clinicalRiskEngine.ts`, this algorithmic engine standardizes frontline clinical assessments without requiring internet connectivity.

### 7.1 Symptom Severity Weights (`SYMPTOM_WEIGHTS`)

```typescript
"chest pain": 4,          "severe bleeding": 5,
"unconscious": 5,         "seizure": 5,
"difficulty breathing": 4,"breathlessness": 3,
"vomiting blood": 4,      "severe pain": 3,
"high fever": 2,          "fever": 2,
"vomiting": 2,            "cough": 1
```

### 7.2 Vital Sign Triggers & Thresholds
* **Oxygen Saturation ($\text{SpO}_2$)**:
  - $< 92\%$: **Immediate RED Trigger** (+4 points, Critical Hypoxia)
  - $92\% - 94\%$: YELLOW Trigger (+2 points, Borderline Oxygenation)
* **Systolic Blood Pressure**:
  - $< 90\text{ mmHg}$: **Immediate RED Trigger** (+4 points, Hypotension / Shock)
  - $> 160\text{ mmHg}$: **Immediate RED Trigger** (+4 points, Hypertensive Crisis)
  - $> 140\text{ mmHg}$: YELLOW Trigger (+2 points, Elevated BP)
* **Pulse / Heart Rate**:
  - $> 120\text{ bpm}$ or $< 50\text{ bpm}$: YELLOW Trigger (+2 points)
* **Body Temperature**:
  - $\ge 39.0^\circ\text{C}$: YELLOW Trigger (+2 points, High Pyrexia)
  - $\ge 38.0^\circ\text{C}$: YELLOW Trigger (+1 point, Fever)

### 7.3 Risk Tier Calculation Logic

```typescript
// Emergency combination rule:
if (hasChestPain && hasBreathlessness) -> Immediate RED (Cardiopulmonary emergency)
if (unconscious || seizure || severeBleeding) -> Immediate RED (Acute emergency)

if (immediateRed || score >= 6) {
  Tier: "RED"     | Level: "emergency" | Action: 108 Emergency Dispatch to Block/District
} else if (score >= 3) {
  Tier: "YELLOW"  | Level: "high"      | Action: Priority referral within 24 hours
} else {
  Tier: "GREEN"   | Level: "low"       | Action: Community home-care & routine ASHA follow-up
}
```

---

## 8. Administrative Geography & Geo-Cascade Engine

Administrative selection is handled by `GeoCascadeSelect.tsx` (`frontend/src/components/common/GeoCascadeSelect.tsx`).

### 8.1 Data Pipeline
* Static geo-data generator: `scripts/generate-geo-data.mjs`.
* Emits pre-computed JSON files into `public/geo-data/`:
  - `index.json`: List of available states and slug identifiers (`west-bengal`, `bihar`, `jharkhand`, `odisha`, `assam`).
  - `{state-slug}.json`: Hierarchical structure mapping Districts -> Blocks -> Villages/Wards.
* The frontend component eagerly fetches `index.json`, then lazy-loads state datasets on demand and caches them in an in-memory `Map<string, StateData>`.

### 8.2 Role-Aware Locking
When an authenticated health worker interacts with `GeoCascadeSelect`:
* **ASHA**: State, District, and Block dropdowns are locked to their assigned territory; Village defaults to their assigned village.
* **BLOCK**: State, District, and Block are locked to their facility's sub-district.
* **DISTRICT**: State and District are locked to their hospital's jurisdiction.
* **Manual Override**: If an unlisted hamlet or ward is encountered, users can toggle `isManual`, replacing dropdowns with free-text inputs.

---

## 9. Multilingual Architecture (`i18n`)

Located in `frontend/src/i18n/`:
* **Store**: `useLanguageStore.ts` (persisted in `localStorage` as `"medexa_preferred_language"`).
* **Supported Languages**: 12 Indian languages:
  1. English (`en` — default)
  2. Hindi (`hi`)
  3. Bengali (`bn`)
  4. Tamil (`ta`)
  5. Telugu (`te`)
  6. Marathi (`mr`)
  7. Gujarati (`gu`)
  8. Kannada (`kn`)
  9. Malayalam (`ml`)
  10. Odia (`or`)
  11. Punjabi (`pa`)
  12. Assamese (`as`)
* **Dual Translation System**:
  1. **Static In-Memory Dictionaries**: `translations.ts` and `portalTranslations.ts` provide curated translations for navigation labels, clinical stages, and portal headers.
  2. **Google Translate Runtime Bridge**: `triggerGoogleTranslate(lang)` dynamically injects the `googtrans` cookie (`/en/${lang}`) and updates the `.goog-te-combo` select element to translate unstructured clinical notes and page content.

---

## 10. Secondary Pages & Features Audit

| File | Real Status in Code | Persistence Mechanism | Verified Behavior |
|---|---|---|---|
| `HighRiskFollowUpPage.tsx` | Active | Hardcoded In-Memory Arrays | Uses `getScopedPatients()`. Dynamically switches patient lists based on whether user is `DISTRICT`, `BLOCK`, or `ASHA`. Does not persist changes. |
| `DoctorAvailabilityPage.tsx` | Active | Hardcoded In-Memory Arrays | Uses `getScopedDoctors()`. Switches roster based on `DISTRICT` vs `BLOCK`. Provides interactive filtering by status (`Available`, `In Consultation`, `Off Duty`). |
| `MedicineAvailabilityPage.tsx`| Active | Hardcoded In-Memory Arrays | Renders static list of essential pharmaceuticals (`Paracetamol`, `Amoxicillin`, `ORS`, `Insulin`, `Azithromycin`) with stock badges. |
| `DiagnosticsPage.tsx` | Active | Hardcoded In-Memory Arrays | Renders static list of tests (`Complete Blood Count`, `X-Ray`, `Ultrasound`, `Blood Glucose`, `ECG`) with turnaround times. |
| `ReportsPage.tsx` | Active | Hardcoded In-Memory Arrays | Renders static analytical charts, monthly referral trends, and facility completion breakdowns. |
| `ReferralTrackerPage.tsx` | Active | Reads `referralStore` | Allows looking up any referral by ID; falls back to an interactive sample referral if no ID is supplied. |
| `PatientEpisodePage.tsx` | Active | Reads Dexie IndexedDB | Fetches `db.patients.get(episode.patientId)` and uses `useCareEpisode` to display longitudinal records. |
| `FacilitiesPage.tsx` | Orphaned | Static Component | Valid route (`/facilities`), but removed from main sidebar navigation. |
| `souvik.tsx` | Dead Code | None | Empty 0-byte file in `src/pages/`. Has no exports and is not imported anywhere. |

---

## 11. Technical Inconsistencies & Deviations from Original Docs

The following concrete deviations exist between the historical design documents (`MEDEXA_CANONICAL_ARCHITECTURE.md`, `MEDEXA_FRONTEND_MASTER_ARCHITECTURE.md`) and the active codebase:

1. **Storage Discrepancy for Referrals**:
   * *Plan*: Dexie.js was planned as the sole repository for referrals (`db.referrals`).
   * *Actual*: Primary operational dashboards read and write exclusively to `referralStore.ts` via `localStorage` (`medexa_unified_referrals_v5`). Dexie is only written to by `CreateReferralForm.tsx` and `TriageForm.tsx`.
2. **Duplicate Authentication Implementations**:
   * *Plan*: A single auth system.
   * *Actual*: `src/auth/auth.ts` (Zustand + `UserSchema`) and `src/sync/referralAuth.ts` (Token-based adapter) exist concurrently with separate credential lists and session storage keys.
3. **Mock Data in Ancillary Pages**:
   * *Plan*: Doctor availability, drug stock, and diagnostics were documented as live data-driven modules.
   * *Actual*: These pages (`DoctorAvailabilityPage`, `MedicineAvailabilityPage`, `DiagnosticsPage`, `ReportsPage`) render hardcoded in-memory arrays.
4. **Offline Sync Scope**:
   * *Plan*: Sync engine would sync all entity updates to a real cloud backend.
   * *Actual*: `syncEngine.ts` pushes queue records against a Vite development middleware mock server (`vite.config.ts`) that immediately returns HTTP 200 `{ status: "success", synced: true }`.
5. **Orphaned File**:
   * `frontend/src/pages/souvik.tsx` is an empty file left over in the source tree.
