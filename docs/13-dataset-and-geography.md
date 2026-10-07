# 13. Dataset Architecture & Pilot Geography — Medexa

## Reference Dataset & Pilot Geography

Medexa standardizes on real administrative geography from the **Government of India Local Government Directory (LGD)** for West Bengal.

### Pilot Geography Scope
- **State**: West Bengal
- **District**: South 24 Parganas / Bankura District
- **Blocks**: Joypur, Sonamukhi, Diamond Harbour
- **Primary Facilities**:
  - `MED-WB-FAC-000372` (Maharajganj Primary Health Centre)
  - `MED-WB-FAC-000349` (M. R. Bangur District Hospital)
  - `MED-WB-FAC-000345` (Diamond Harbour District Hospital)
  - `FAC-WB-PHC-01` (Belur Block PHC)

---

## Synthetic Operational Care Scenarios

The operational database seed script (`backend/scripts/seed_operational_demo.py`) populates 7 distinct care journey scenarios:

1. **Scenario 1 — Successful Routine Referral**: Intake → Low/Moderate Triage → Referral → Acceptance → Arrival → Consultation → Completion.
2. **Scenario 2 — Delayed Referral / Patient No-Show**: Referral → Acknowledged → Arrival Deadline Passes → SLA Breach Alert → Rescue Action Triggered.
3. **Scenario 3 — Facility Capacity Constrained**: Destination facility capacity marked `FULL` → Alternative routing suggested.
4. **Scenario 4 — Missed Follow-up & Continuity Escalation**: Back-referral home visit scheduled → Due date passes → Task flagged overdue → Continuity risk score elevated.
5. **Scenario 5 — High-Risk Maternal Emergency**: High-risk triage (SpO2 < 90%, Severe Hypertension) → Emergency Referral → District Escalation → Specialist Consultation → Back-Referral Packet → ASHA 48h Home Visit.
6. **Scenario 6 — Routine Low-Risk Local Care**: Low-risk triage → Local advice & Sub-centre care → No referral needed.
7. **Scenario 7 — Terminal Rejection / Cancellation**: Example of appropriate terminal state handling (`REJECTED` or `CANCELLED`).
