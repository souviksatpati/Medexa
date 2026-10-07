# 04. Canonical Domain Model — Medexa

## Entity Relationship Overview

The Medexa domain model revolves around a **Single Patient Identity** strategy. Every care record hangs off a stable `patient_id` and an active `care_episode_id`.

```
                        ┌────────────────────────┐
                        │        Patient         │
                        │ (id: UUID, name, sex)  │
                        └───────────┬────────────┘
                                    │ 1
                                    │
                                    │ N
                        ┌───────────▼────────────┐
                        │      Care Episode      │
                        │(id: UUID, patient_id)  │
                        └───────────┬────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │ 1..N                       │ 1..N                       │ 1..N
┌──────▼─────────────────┐   ┌──────▼─────────────────┐   ┌──────▼─────────────────┐
│   Triage Assessment    │   │        Referral        │   │     Follow-up Task     │
│ (clinical_risk_level)  │   │ (current_state, SLA)   │   │(assigned_to, due_at)   │
└────────────────────────┘   └───────────┬────────────┘   └────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │ 1..N                           │ 0..1                           │ 0..1
┌───────▼────────────────┐      ┌────────▼───────────────┐      ┌─────────▼──────────────┐
│State Transition History│      │   Back-Referral Packet │      │  Referral SLA Record   │
│(from_state, to_state)  │      │(outcome, instructions) │      │(due dates & breach)    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

---

## Single Patient Identity & Care Episode Strategy

### 1. Patient (`patients` table)
- **Primary Key**: `id` (UUID v4 string, e.g. `550e8400-e29b-41d4-a716-446655440000`).
- **Attributes**: `full_name`, `age`, `sex` (`male` | `female` | `other`), `village_or_ward`, `phone`, `chronic_conditions` (JSON array), `created_at`.
- **Constraint**: Permanent and immutable. Name matching is never used for relational queries.

### 2. Care Episode (`care_episodes` table)
- **Primary Key**: `id` (UUID v4 string).
- **Foreign Key**: `patient_id` → `patients.id`.
- **Attributes**: `status` (`open` | `closed`), `opened_at`, `closed_at`.
- **Purpose**: Represents a discrete clinical encounter window. All triage assessments, referrals, and follow-ups within an encounter bind to `care_episode_id`.

### 3. Triage Assessment (`triage_assessments` table)
- **Primary Key**: `id` (UUID v4 string).
- **Foreign Key**: `care_episode_id` → `care_episodes.id`.
- **Attributes**: `symptoms` (JSON array), `vitals` (JSON object: `systolic_bp`, `diastolic_bp`, `pulse`, `temp_c`, `spo2`), `clinical_risk_level` (`LOW` | `MODERATE` | `HIGH` | `EMERGENCY`), `notes`, `performed_by`, `performed_at`.

### 4. Referral (`referrals` table)
- **Primary Key**: `id` (UUID v4 string or `REF-xxxx`).
- **Foreign Keys**:
  - `care_episode_id` → `care_episodes.id`
  - `patient_id` → `patients.id`
  - `from_facility_id` → `facilities.id`
  - `to_facility_id` → `facilities.id`
- **Attributes**: `current_state` (`ReferralState` enum), `reason`, `priority` (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`), `created_at`, `created_by`, `sync_status`.

### 5. Referral State Transition (`referral_state_transitions` table)
- **Primary Key**: `id` (UUID v4 string).
- **Foreign Key**: `referral_id` → `referrals.id`.
- **Attributes**: `from_state`, `to_state`, `changed_by`, `changed_at`, `device_local_timestamp`, `note`.

### 6. Back-Referral Packet (`back_referrals` table)
- **Primary Key**: `id` (UUID v4 string).
- **Foreign Key**: `referral_id` → `referrals.id`.
- **Attributes**: `outcome`, `treatment`, `medication` (JSON array), `follow_up_date`, `warning_signs` (JSON array), `instructions`, `recorded_by`, `recorded_at`.

### 7. Follow-up Task (`follow_up_tasks` table)
- **Primary Key**: `id` (UUID v4 string).
- **Foreign Keys**:
  - `care_episode_id` → `care_episodes.id`
  - `referral_id` → `referrals.id` (optional)
- **Attributes**: `due_at`, `reason`, `assigned_to`, `status` (`pending` | `completed` | `overdue`), `completed_at`.
