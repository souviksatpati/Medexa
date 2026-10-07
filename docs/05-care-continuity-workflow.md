# 05. End-to-End Care Continuity Workflow — Medexa

## Complete Care Journey Walkthrough

The Medexa platform orchestrates a 10-step closed-loop care journey across frontline, secondary, and tertiary healthcare tiers.

```
 [1. Intake/Search] ──> [2. Care Episode] ──> [3. Digital Triage] ──> [4. Risk Score]
                                                                            │
 [8. Follow-up Visit] <── [7. Back Referral] <── [6. Consultation] <── [5. Referral Dispatch]
```

---

## Step-by-Step Stage Execution

### Step 1: Patient Search or Registration (ASHA Frontline Tier)
- **Actor**: ASHA Frontline Worker (`UserRole.ASHA_WORKER`).
- **Action**: Search for an existing patient by name/ID, or register a new patient via the Patient Intake Modal.
- **System Behavior**:
  - Allocates a permanent UUID `patient_id`.
  - Sets `ActiveCareContext`: `{ patientId, patientName, careEpisodeId, ... }`.
  - Stores Patient locally in Dexie and queues `POST /api/patients` when online.

### Step 2: Care Episode Establishment
- **Actor**: ASHA Frontline Worker.
- **Action**: Open a new Care Episode for the active patient context.
- **System Behavior**:
  - Creates `CareEpisode` with `status: "open"`.
  - Binds all subsequent clinical records to `care_episode_id`.

### Step 3: Digital Triage Assessment
- **Actor**: ASHA Frontline Worker.
- **Action**: Input symptoms, vitals (SpO2, Blood Pressure, Pulse, Body Temp), and observational notes in `TriageForm`.
- **System Behavior**:
  - Displays persistent **Patient Context Header** (`PATIENT: Ramesh Kumar | PAT-xxxx | Episode EP-xxxx`).
  - Stores `TriageAssessment` bound to `care_episode_id`.

### Step 4: Clinical Risk Assessment & Recommendation
- **Actor**: System (Rule-based Decision Support Engine).
- **Action**: Evaluate symptoms and vitals against clinical urgency thresholds.
- **System Behavior**:
  - Returns `ClinicalRiskLevel`: `LOW`, `MODERATE`, `HIGH`, or `EMERGENCY`.
  - Displays explainable risk recommendations (e.g. "Oxygen saturation < 92%: Urgent evaluation required").
  - If risk level is `HIGH` or `EMERGENCY`, activates **[Create Referral]** button pre-populated with active patient context.

### Step 5: Referral Creation & Dispatch
- **Actor**: ASHA Frontline Worker.
- **Action**: Select destination facility (e.g. Belur Block PHC) and priority, then submit referral.
- **System Behavior**:
  - Creates `Referral` record with `current_state: "SENT"`.
  - Initializes `ReferralSla` timelines (acknowledgement due within 2 hours).
  - Referral becomes visible in the Block Officer's incoming queue.

### Step 6: Block PHC Reception & Acceptance (Secondary Tier)
- **Actor**: Block Medical Officer (`UserRole.DOCTOR`).
- **Action**: View incoming referral in Block Portal queue, accept referral, and log arrival.
- **System Behavior**:
  - Transitions referral state: `SENT` → `RECEIVED` → `ACCEPTED` → `ARRIVED`.
  - ASHA worker sees live status update: `"Being evaluated at Block Health Centre"`.

### Step 7: District Hospital Emergency Escalation (Tertiary Tier)
- **Actor**: Block Medical Officer / District Specialist.
- **Action**: If tertiary care is required, escalate referral to District Hospital.
- **System Behavior**:
  - Transitions state: `ACCEPTED` → `EMERGENCY_ESCALATED` → `CONSULTED`.
  - Dispatch notification sent to District Officer portal.

### Step 8: Specialist Consultation & Treatment
- **Actor**: District Hospital Specialist (`UserRole.DISTRICT_OFFICER`).
- **Action**: Conduct specialist consultation, administer treatment, and stabilize patient.

### Step 9: Structured Back-Referral Packet
- **Actor**: District Specialist / Facility Discharge Coordinator.
- **Action**: Fill Back-Referral form with treatment summary, prescribed medication, warning signs, and post-discharge instructions.
- **System Behavior**:
  - Creates `BackReferral` record linked to `referral_id`.
  - Transitions referral state to `REFERRED_BACK`.
  - Automatically generates a `FollowUpTask` assigned to the originating ASHA worker due within 48-72 hours.

### Step 10: ASHA Home Visit & Closed-Loop Follow-up
- **Actor**: ASHA Frontline Worker.
- **Action**: Visit patient's home, verify vitals, check medication adherence, and mark follow-up task completed.
- **System Behavior**:
  - Updates `FollowUpTask` to `status: "completed"`.
  - Transitions referral state to `FOLLOW_UP_COMPLETED` → `CLOSED`.
  - Completes the closed-loop care journey.
