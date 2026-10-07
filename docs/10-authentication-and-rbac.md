# 10. Authentication & RBAC — Medexa

## Authentication Architecture

Medexa implements stateless, role-based JWT authentication backed by PostgreSQL health worker registry records.

```
 Frontline / Officer Portal              FastAPI Backend                PostgreSQL Database
 ┌────────────────────────┐             ┌─────────────────┐             ┌──────────────────┐
 │ User Enters Worker ID  │ ──────────> │ POST /auth/login│ ──────────> │ Query Health     │
 │ & Security PIN         │             │                 │             │ Worker Registry  │
 └────────────────────────┘             └────────┬────────┘             └──────────────────┘
                                                 │
                                                 ▼
 ┌────────────────────────┐             ┌─────────────────┐
 │ Store Token in         │ <────────── │ Return JWT Bearer│
 │ localStorage[auth_token│             │ Token (role, id)│
 └───────────┬────────────┘             └─────────────────┘
             │
             ▼
 ┌────────────────────────┐             ┌─────────────────┐
 │ API Requests Include   │ ──────────> │ Verify Token &  │
 │ Authorization: Bearer  │             │ Enforce Role    │
 └────────────────────────┘             └─────────────────┘
```

---

## Role-Based Access Control (RBAC) Matrix

| Portal Role | User Role Enum | Accessible Facilities / Scope | Authorized Actions |
|---|---|---|---|
| **ASHA Worker** | `ASHA_WORKER` | Assigned Village / Sub-Centre | Register patient, open care episode, submit digital triage, create referral, view back-referral packets, complete home follow-up tasks |
| **Block Officer** | `DOCTOR` | Block PHC / CHC Facility | View incoming village referrals, accept referrals, log patient arrival, conduct consultation, escalate emergency cases to District |
| **District Officer** | `DISTRICT_OFFICER` | District General Hospital / District-wide | Oversee district referral queue, view SLA breach alerts, conduct specialist consultation, issue back-referral packets, view district continuity analytics |

---

## Session Restoration Sequencing
To prevent JWT initialization race conditions:
1. When `useAuthStore` initializes on page load, if a validated session exists in local storage but `auth_token` is missing, `syncBackendJwt(initialUser.role)` is awaited.
2. User store state `user` is set **only after** `localStorage["auth_token"]` is populated.
3. Frontline components (e.g. `AshaReferralPage`) mount only when `user` state is populated, guaranteeing that the first operational request (`GET /api/referrals`) contains a valid `Authorization: Bearer <JWT>` header.
