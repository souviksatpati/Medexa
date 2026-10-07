# 01. Product Overview — Medexa

## Problem Context
In rural and underserved healthcare environments, patients frequently suffer from fragmented care journeys. A patient seen by an Accredited Social Health Activist (ASHA) in a remote village may be referred to a Block Primary Health Centre (PHC) or Community Health Centre (CHC), and subsequently escalated to a District General Hospital.

Without an integrated digital tracking layer, critical issues emerge:
- **Lost Patients**: Referrals are lost in transit without notification or arrival tracking.
- **SLA Breaches**: Urgent medical cases experience delays without automated alert mechanisms.
- **Disconnected Post-Discharge Care**: Once treated at a tertiary facility, patients return home without back-referral instructions or structured ASHA follow-up tasks.
- **Intermittent Connectivity**: Frontline health workers operate in regions with poor or absent mobile network coverage, rendering traditional web applications unusable.

---

## Medexa Solution Concept
Medexa is an **offline-first care-continuity and referral-tracking platform** built specifically for rural public health systems. It bridges the frontline ASHA worker, the Block Medical Officer, and the District Health Officer into a single unified care-journey pipeline.

```
       Frontline Tier               Primary / Secondary Tier               Tertiary Tier
 ┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
 │   ASHA Frontline Worker │ ────> │  Block Medical Officer  │ ────> │  District Specialist    │
 │  (Village Sub-Centre)   │       │   (Block PHC / CHC)     │       │ (District Gen Hospital) │
 └─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
              ▲                                                                   │
              └──────────────────── Back Referral & Home Follow-up ───────────────┘
```

---

## Core System Capabilities

### 1. Offline-First Frontline Operation
ASHA workers can register new patients, establish care episodes, conduct digital triage assessments, and issue urgent referrals even when completely disconnected from the internet. All records are stored locally in IndexedDB (via Dexie.js) and queued for background synchronization.

### 2. Single Immutable Patient Identity
Every patient receives a permanent `patient_id` (UUID v4) at registration. All subsequent care episodes, triage entries, referrals, state transitions, back-referrals, and follow-up tasks remain bound to this exact patient identity.

### 3. Enforced Referral State Machine
Referrals transition through a deterministic 11-state lifecycle validated by backend business rules (`DRAFT` → `SENT` → `RECEIVED` → `ACCEPTED` → `IN_TRANSIT` → `ARRIVED` → `CONSULTED` → `REFERRED_BACK` → `FOLLOW_UP_DUE` → `FOLLOW_UP_COMPLETED` → `CLOSED`).

### 4. SLA Monitoring & Rescue Escalations
Automated background monitoring checks referral acknowledgment and consultation timers. If SLA thresholds are breached, rescue actions are triggered to alert supervisors and re-route cases.

### 5. Back-Referral & Closed-Loop Follow-up
When tertiary treatment concludes, a structured Back-Referral packet is dispatched to the originating ASHA worker, creating scheduled home visit follow-up tasks to guarantee post-discharge care continuity.
