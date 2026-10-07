# MEDEXA — Frontend Master Architecture, Workflow & AI Handoff Specification

> **CANONICAL REFERENCE DOCUMENT**: This document provides the complete, authoritative architectural specification, runtime workflow, state machines, directory structure, and current status of the **Medexa** frontend application. Any AI assistant or developer picking up this repository should read this document to understand the codebase without needing prior conversational context.

---

## 1. Project Overview & Identity

- **Project Name**: **Medexa** *(Strict naming rule: Never use PRAGATI, SETOU, or generic names).*
- **Problem Statement**: **SIH26133 — Integrated Care-Access & Quality Support System for Rural/Underserved Healthcare**
- **Core Mission**: An offline-first, multi-tier healthcare continuity platform designed for rural and underserved Indian healthcare ecosystems. It bridges frontline village health workers (**ASHA**), **Block Health Offices** (PHCs/CHCs), and **District Hospitals** (CMOH/Tertiary Specialists) with real-time verified referral lifecycles, emergency triage, telemetry, and bi-directional care loops.
- **Frontend Stack**:
  - **Framework & Runtime**: React 18.3.1, TypeScript 5.5.4, Vite 6.4.3
  - **Styling**: Tailwind CSS 3.4.10, CSS Modules / Vanilla tokens, Material Symbols Outlined, Plus Jakarta Sans, Atkinson Hyperlegible Next, Noto Sans Indic Scripts
  - **State Management**: Zustand 4.5.4 (Reactive Stores with `localStorage` fallback and memory caching)
  - **Local Database & Offline Storage**: Dexie.js 4.0.8 (IndexedDB) with transactional `SyncQueue`
  - **Mapping & Geospatial**: Leaflet 1.9.4 & React-Leaflet 4.2.1
  - **Schema Validation**: Zod 3.23.8
  - **PWA & Offline Service Worker**: `vite-plugin-pwa` 0.21.1 (Workbox runtime caching)

---

## 2. High-Level System Architecture

```
                                  USER BROWSERS & MOBILE CLIENTS
                               (Frontline ASHA / Block MO / District CMOH)
                                                 │
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MEDEXA FRONTEND CORE                                          │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                    ROUTING & PAGES LAYER                                   │  │
│  │  • HomePage ("/")                                   • DigitalTriagePage ("/episode/:id/triage")│  │
│  │  • DistrictDashboardPage ("/dashboard")             • HighRiskFollowUpPage ("/dashboard/follow-up")│
│  │  • ReferralsPage ("/dashboard/referrals")           • FacilitiesPage ("/dashboard/facilities")     │
│  │  • AshaReferralPage ("/dashboard/referrals/asha")   • MedicineAvailabilityPage                     │
│  │  • RuralOfficeDashboardPage (".../block-office")    • DiagnosticsPage                              │
│  │  • DistrictOfficePage (".../district-office")       • AppointmentsPage                             │
│  │  • ReferralDetailsPage (".../referrals/:id")        • ReportsPage                                  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                │                                                 │
│                        ┌───────────────────────┴───────────────────────┐                         │
│                        ▼                                               ▼                         │
│  ┌──────────────────────────────────────────┐    ┌──────────────────────────────────────────┐    │
│  │       REACTIVE STORES & AUTH LAYER       │    │      UI COMPONENTS & DESIGN SYSTEM       │    │
│  │  • referralStore.ts (Zustand)            │    │  • HomeHeader & Mobile Drawer Navigation │    │
│  │    - Master Unified Referrals            │    │  • LanguageSelector (12 Indian Scripts)  │    │
│  │    - 4-Tier Geo Lifecycle Operations     │    │  • ReferralNavTabs & RiskBadges          │    │
│  │    - Patient Situation Audit Log         │    │  • ReferralTracker & Timeline Connectors │    │
│  │  • referralAuth.ts (Zustand)             │    │  • Dedicated Auth Modals:                │    │
│  │    - Health Registry Database            │    │    (AshaAuthModal, BlockOfficeAuthModal, │    │
│  │    - PIN & Role Verification             │    │     DistrictOfficeAuthModal)             │    │
│  │  • useLanguageStore.ts (12 i18n Locales) │    │  • FacilityContinuityTable & KPI Cards   │    │
│  └──────────────────────────────────────────┘    └──────────────────────────────────────────┘    │
│                        │                                               │                         │
│                        └───────────────────────┬───────────────────────┘                         │
│                                                │                                                 │
│                                                ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                             OFFLINE-FIRST PERSISTENCE LAYER                                │  │
│  │  • db.ts (Dexie / IndexedDB: "care-continuity-db")                                         │  │
│  │    - Tables: patients, careEpisodes, triageAssessments, referrals, referralTransitions     │  │
│  │    - syncQueue: Table<SyncQueueItem> (FIFO local mutation log with retry counters)         │  │
│  │  • syncEngine.ts: Automatic background push/pull daemon with exponential backoff           │  │
│  │  • localStorage: "medexa_unified_referrals_v5", auth tokens, language preferences          │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                 │
                                                 ▼
                                     BACKEND REST API / ENGINE
                           (FastAPI, PostgreSQL, RabbitMQ, Health Sync)
```

---

## 3. End-to-End Multi-Tier Referral Workflow

The application implements a strict 4-tier geographic and administrative escalation pipeline:
`Village (ASHA)` ➔ `Block Office (PHC/CHC)` ➔ `District Hospital (Tertiary)` ➔ `Village Follow-Up (ASHA)`

```
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. VILLAGE FRONTLINE LEVEL (ASHA Worker)                                                │
  │    • Authenticates via AshaAuthModal (ASHA-WB-401 / PIN 1234)                           │
  │    • Assesses patient in village (vital signs, clinical symptoms, risk factors)         │
  │    • Initiates Referral to Block PHC/CHC via CreateReferralForm:                        │
  │        - 4 Geographic Levels: 1. State, 2. District, 3. Block, 4. Village/Ward         │
  │        - Urgency/Triage: RED (Emergency), YELLOW (High Priority), GREEN (Routine)       │
  │        - Transport: 108 ALS Ambulance / ASHA Escort                                    │
  │    • Status: "Referred to Block" ➔ "At Block Office"                                    │
  └────────────────────────────────────────────┬────────────────────────────────────────────┘
                                               │
                                               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 2. BLOCK HEALTH OFFICE LEVEL (BMOH / Block Medical Officer)                             │
  │    • Authenticates via BlockOfficeAuthModal (BHO-WB-204 / PIN 4321)                     │
  │    • Views incoming village cases on RuralOfficeDashboardPage                           │
  │    • Action Options:                                                                    │
  │        a) Treat & discharge at Block PHC                                                │
  │        b) Create new Block Referral to District Hospital                                │
  │        c) Escalate Critical Patient to District Hospital:                               │
  │             - Assigns Tertiary Specialist & Receiving Facility                          │
  │             - Updates status to "Escalated to District"                                 │
  └────────────────────────────────────────────┬────────────────────────────────────────────┘
                                               │
                                               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 3. DISTRICT TERTIARY LEVEL (CMOH / District Specialist)                                 │
  │    • Authenticates via DistrictOfficeAuthModal (CMOH-DIST-101 / PIN 5678)               │
  │    • Monitors escalated cases on DistrictOfficePage                                     │
  │    • Specialist Actions:                                                                │
  │        a) Admit Patient:                                                                │
  │             - Allocates Ward / ICU Bed (e.g. ICU-Bed 04)                                │
  │             - Assigns Chief Specialist                                                  │
  │             - Sets status: "In Consultation"                                            │
  │        b) Back-Refer to Village ASHA:                                                   │
  │             - Issues post-discharge clinical instructions                               │
  │             - Sets follow-up schedule (e.g., visit every 48 hours for BP/vitals check)  │
  │             - Sets status: "Back-Referred"                                              │
  └────────────────────────────────────────────┬────────────────────────────────────────────┘
                                               │
                                               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 4. CLOSING THE LOOP: ASHA PATIENT SITUATION TRACKING                                    │
  │    • Village ASHA Worker visits AshaReferralPage                                        │
  │    • Searches patient solely by Name or ASHA ID (no complex dropdown roadblocks)        │
  │    • Clicks "Track Situation" on patient card/row:                                      │
  │        - Modal shows chronological journey across Village ➔ Block ➔ District ➔ Home     │
  │        - Reads district hospital discharge advice & home monitoring instructions        │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. State Management Architecture

### A. Unified Referral Store (`frontend/src/sync/referralStore.ts`)
- **Persistence Key**: `localStorage["medexa_unified_referrals_v5"]`
- **Data Entity**: `UnifiedReferral`
  ```typescript
  export interface UnifiedReferral {
    id: string;                      // e.g. "ASHA-REF-101"
    patientName: string;
    patientId: string;                // e.g. "PAT-8801"
    ageGender: string;                // e.g. "24 F"
    state: string;                    // "West Bengal"
    district: string;                 // "Bankura"
    block: string;                    // "Joypur Block"
    village: string;                  // "Rampur Village"
    sourceLevel: "ASHA" | "BLOCK" | "DISTRICT";
    targetLevel: "BLOCK_OFFICE" | "DISTRICT_OFFICE";
    fromFacilityOrWorker: string;
    toFacility: string;
    category: string;
    priority: "Emergency" | "High" | "Normal";
    triageLevel: "RED" | "YELLOW" | "GREEN";
    status: "Referred to Block" | "At Block Office" | "Escalated to District" | "In Consultation" | "Completed" | "Back-Referred";
    assignedDoctor: string;
    referralDate: string;
    lastAction: string;
    clinicalNotes: string;
    escortTransport: string;
  }
  ```
- **Key Store Methods**:
  - `addAshaReferral(referral)`: Enqueues a new village referral with `sourceLevel: "ASHA"` and `targetLevel: "BLOCK_OFFICE"`.
  - `addBlockReferral(referral)`: Creates a Block-originating referral to District Office.
  - `escalateToDistrict(id, hospital, doctor, transport, notes)`: Transitions an existing referral to `"Escalated to District"`, updating clinician and transport telemetry.
  - `admitDistrictPatient(id, doctor, ward, clinicalUpdate)`: Sets status to `"In Consultation"`, recording bed allocation and specialist notes.
  - `backReferPatient(id, instructions, followUpDays)`: Sets status to `"Back-Referred"`, passing home-care protocol back to the ASHA worker.
  - `sanitizeReferral(raw)`: Defensive guard guaranteeing all 18 fields exist and prevents `null`/`undefined` property exceptions.

### B. Health Registry Authentication Store (`frontend/src/sync/referralAuth.ts`)
- **State Model**:
  - Sessions start **unauthenticated (`false` / `null`)** by default.
  - Separate session slots: `ashaUser`, `blockOfficerUser`, `districtOfficerUser`.
  - Independent session keys: `medexa_auth_asha_v3`, `medexa_auth_block_v3`, `medexa_auth_district_v3`.
- **Pre-registered Health Workers Database (`HEALTH_REGISTRY_DATABASE`)**:
  - **ASHA Workers**:
    - `ASHA-WB-401` / PIN `1234` — Kavita Roy (Belur Village, Joypur Block)
    - `ASHA-WB-402` / PIN `1234` — Rita Mandal (Ramnagar Village, Joypur Block)
    - `ASHA-WB-403` / PIN `1234` — Sunita Soren (Gopalpur Village, Sonamukhi Block)
  - **Block Health Officers**:
    - `BHO-WB-204` / PIN `4321` — Dr. Anirban Roy (BMOH, Joypur Block PHC)
    - `BHO-WB-205` / PIN `4321` — Dr. S. Chatterjee (MOIC, Sonamukhi Rural Hospital)
  - **District Health Officers**:
    - `CMOH-DIST-101` / PIN `5678` — Dr. A. Sen (Chief Specialist, Bankura District Hospital)
    - `CMOH-DIST-102` / PIN `5678` — Dr. P. Mukherjee (Deputy CMOH, Bankura HQ)
- **Validation**:
  - `verifyAndLogin(identifier, pin, expectedRole)` performs case-insensitive registry lookup. Returns `{ success: false, error: "..." }` for unmatched credentials, preventing unauthorized portal access.

### C. Multilingual i18n Store (`frontend/src/i18n/useLanguageStore.ts`)
- **Persistence Key**: `localStorage["medexa_preferred_language"]` (defaults to `"en"`).
- **Supported Languages (12)**:
  1. `en` — English
  2. `hi` — हिन्दी (Hindi)
  3. `bn` — বাংলা (Bengali)
  4. `ta` — தமிழ் (Tamil)
  5. `te` — తెలుగు (Telugu)
  6. `mr` — मराठी (Marathi)
  7. `gu` — ગુજરાતી (Gujarati)
  8. `kn` — ಕನ್ನಡ (Kannada)
  9. `ml` — മലയാളം (Malayalam)
  10. `or` — ଓଡ଼ିଆ (Odia)
  11. `pa` — ਪੰਜਾਬੀ (Punjabi)
  12. `as` — অসমীয়া (Assamese)
- **Direct Header Integration**: LanguageSelector is positioned directly on the header bar on both Desktop (`🌐 English ▾`) and Mobile (`🌐 EN ▾`). Text updates reactively without page reloads.

---

## 5. Directory Structure & Key Files

```
d:/14_web_project/Medexa-New-frontend/frontend/
├── index.html                           # Entry HTML with Google Fonts for Indic scripts
├── package.json                         # Dependencies & npm scripts
├── tailwind.config.ts                   # Tailwind tokens (primary, surface, container, error)
├── vite.config.ts                       # Vite bundling & PWA configuration
└── src/
    ├── App.tsx                          # Router provider & route alias definitions
    ├── main.tsx                         # React 18 DOM bootstrap
    │
    ├── components/
    │   ├── common/
    │   │   ├── BrandMark.tsx            # Medexa logo icon + text (responsive down to 320px)
    │   │   ├── DashboardSidebar.tsx     # Persistent sidebar with nested referral links
    │   │   ├── ErrorBoundary.tsx        # Top-level React error boundary
    │   │   ├── HomeHeader.tsx           # Home navigation bar with language picker & mobile drawer
    │   │   ├── LanguageSelector.tsx     # Direct header dropdown with 12 Indic languages
    │   │   ├── RiskBadges.tsx           # RED/YELLOW/GREEN clinical urgency badges
    │   │   └── SyncIndicator.tsx        # Real-time online/offline sync status pill
    │   │
    │   ├── dashboard/
    │   │   ├── ContinuityOverview.tsx   # District KPIs & referral conversion rates
    │   │   ├── FacilityContinuityTable.tsx # PHC/CHC bed & staffing availability table
    │   │   └── ReferralContinuitySummary.tsx
    │   │
    │   ├── referral/
    │   │   ├── AshaAuthModal.tsx        # Dedicated ASHA worker PIN authentication modal
    │   │   ├── BlockOfficeAuthModal.tsx # Dedicated Block Medical Officer login modal
    │   │   ├── DistrictOfficeAuthModal.tsx # Dedicated District CMOH login modal
    │   │   ├── CreateReferralChoiceModal.tsx # Modal strictly offering: 1. ASHA, 2. Block Office
    │   │   ├── CreateReferralForm.tsx   # 4-tier geographic referral creation form
    │   │   ├── ReferralNavTabs.tsx      # Top tabs: All | ASHA | Block Office | District Office
    │   │   └── ReferralTracker.tsx      # Vertical timeline of care transitions
    │   │
    │   └── triage/
    │       └── TriageForm.tsx           # Clinical risk assessment & vital entry form
    │
    ├── i18n/
    │   ├── languages.ts                 # Language definitions, codes, scripts, short codes
    │   ├── translations.ts              # Full 12-language dictionary schemas
    │   └── useLanguageStore.ts          # Zustand translation store with fallback logic
    │
    ├── models/
    │   └── careEpisode.ts               # Core clinical interfaces (Patient, CareEpisode, Triage)
    │
    ├── pages/
    │   ├── HomePage.tsx                 # Responsive home page with Indic typography & CTAs
    │   ├── DistrictDashboardPage.tsx    # District Health Officer analytics & facility maps
    │   ├── ReferralsPage.tsx            # Master referral registry across all tiers
    │   ├── AshaReferralPage.tsx         # ASHA portal: simplified search & situation tracking
    │   ├── RuralOfficeDashboardPage.tsx # Block Office portal: triage & district escalation
    │   ├── DistrictOfficePage.tsx       # District portal: tertiary admission & ASHA back-referral
    │   ├── ReferralDetailsPage.tsx      # Deep dive into individual referral timeline & notes
    │   ├── PatientEpisodePage.tsx       # Longitudinal patient EHR & episode history
    │   ├── DigitalTriagePage.tsx        # Frontline clinical triage calculator
    │   ├── FacilitiesPage.tsx           # Health sub-centre and hospital directory
    │   ├── MedicineAvailabilityPage.tsx # Stock levels & critical drug tracker
    │   ├── DiagnosticsPage.tsx          # Lab test availability & diagnostic queues
    │   ├── AppointmentsPage.tsx         # Teleconsultation & specialist booking
    │   ├── HighRiskFollowUpPage.tsx     # ANC/NCD high-risk patient roster
    │   └── ReportsPage.tsx              # District health KPI reports and exports
    │
    ├── styles/
    │   └── globals.css                  # Typography fallbacks, timeline lines, scrollbar rules
    │
    └── sync/
        ├── db.ts                        # Dexie IndexedDB schemas & writeAndQueue helper
        ├── referralAuth.ts              # Registry database & multi-role auth store
        ├── referralStore.ts             # UnifiedReferral store with escalation methods
        └── syncEngine.ts                # Background push/pull sync daemon
```

---

## 6. Current Routing Table & Shortcuts

| Route Path | Component | Description & Access |
|---|---|---|
| `/` | `HomePage` | Public Home page with 12-language support & mobile drawer |
| `/dashboard` | `DistrictDashboardPage` | Executive health dashboard with real-time indicators |
| `/dashboard/referrals` | `ReferralsPage` | Master referral queue across all 3 tiers with "+ Create Referral" modal |
| `/dashboard/referrals/asha` | `AshaReferralPage` | Village ASHA portal with situation tracking |
| `/dashboard/referrals/block-office` | `RuralOfficeDashboardPage` | Block Office portal for triage & escalation to District |
| `/dashboard/referrals/district-office`| `DistrictOfficePage` | District Hospital portal for admissions & back-referrals |
| `/dashboard/referrals/:referralId` | `ReferralDetailsPage` | Full clinical audit trail and state history |
| `/episode/:careEpisodeId` | `PatientEpisodePage` | Patient care episode and longitudinal history |
| `/episode/:careEpisodeId/triage` | `DigitalTriagePage` | Clinical risk triage calculator |
| `/referrals` | Redirects to `/dashboard/referrals` | Direct URL shortcut |
| `/referrals/asha` | Redirects to `/dashboard/referrals/asha` | Direct URL shortcut |
| `/referrals/block-office` | Redirects to `/dashboard/referrals/block-office` | Direct URL shortcut |
| `/referrals/district-office`| Redirects to `/dashboard/referrals/district-office` | Direct URL shortcut |

---

## 7. Operational Guidelines for Future AI & Developers

When continuing development or building new features in this codebase:

1. **Strictly Preserve Naming**: The platform is **Medexa**. Never introduce alternate names.
2. **Never Break Unauthenticated Gate**: Authentication must always initialize to `null` (`false`) until explicit PIN verification against `HEALTH_REGISTRY_DATABASE` occurs.
3. **Use the `safeStr` Helper**: When filtering or manipulating patient/referral strings, always sanitize inputs using `safeStr(val)` or `String(val || "")` to maintain zero-crash resilience against missing backend fields.
4. **Maintain 4 Geographic Levels**: Every referral form must include:
   1. State
   2. District
   3. Block
   4. Village / Ward
5. **Keep "+ Create Referral" Strictly 2 Options**:
   - Option 1: **ASHA Referral** (Village ➔ Block Office)
   - Option 2: **Block Office Referral** (Block Office ➔ District Hospital)
   - *Note: District Officers do not create initial referrals; they manage escalations and back-refer.*
6. **Preserve Indic Typography**: When adding UI text, use translation keys (`t("section", "key")`) rather than hardcoded English strings so all 12 Indian languages continue to render seamlessly.
7. **Production Verification**: Always verify code changes by running `npm run build` (`tsc -b && vite build`) to confirm zero TypeScript compilation errors.
