import asyncio
import os
import uuid
from httpx import AsyncClient, ASGITransport

os.environ["DATABASE_URL"] = "postgresql+asyncpg://medexa_user:medexa_pass@localhost:5432/medexa"
os.environ["DATABASE_URL_SYNC"] = "postgresql+psycopg2://medexa_user:medexa_pass@localhost:5432/medexa"

from app.main import app

async def run_integration_tests():
    print("=== STARTING MEDEXA FULL STACK INTEGRATION VERIFICATION ===")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health Check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[PASS] 1. Health Endpoint: /health -> 200 OK")

        # 2. Auth Login for ASHA
        res = await client.post("/auth/login", data={"username": "asha.demo", "password": "demo1234"})
        assert res.status_code == 200, f"ASHA login failed: {res.text}"
        asha_token = res.json()["access_token"]
        print("[PASS] 2a. ASHA Login: asha.demo -> Token received")

        # Auth Login for Doctor
        res = await client.post("/auth/login", data={"username": "doctor.demo", "password": "demo1234"})
        assert res.status_code == 200, f"Doctor login failed: {res.text}"
        doctor_token = res.json()["access_token"]
        print("[PASS] 2b. Doctor Login: doctor.demo -> Token received")

        # Auth Login for District Officer
        res = await client.post("/auth/login", data={"username": "officer.demo", "password": "demo1234"})
        assert res.status_code == 200, f"Officer login failed: {res.text}"
        officer_token = res.json()["access_token"]
        print("[PASS] 2c. District Officer Login: officer.demo -> Token received")

        headers_asha = {"Authorization": f"Bearer {asha_token}"}
        headers_doc = {"Authorization": f"Bearer {doctor_token}"}
        headers_off = {"Authorization": f"Bearer {officer_token}"}

        # 3. Patient Retrieval
        res = await client.get("/patients", headers=headers_asha)
        assert res.status_code == 200, f"Patient list failed: {res.text}"
        patients = res.json()
        assert len(patients) >= 50, f"Expected >=50 patients, got {len(patients)}"
        print(f"[PASS] 3. Patient Retrieval: {len(patients)} records retrieved from DB")

        # 4. Create New Referral (ASHA workflow)
        res_refs = await client.get("/referrals", headers=headers_asha)
        referrals = res_refs.json()
        existing_patient_id = referrals[0]["patient_id"]
        care_episode_id = referrals[0]["care_episode_id"]

        new_ref_id = f"REF-TEST-{uuid.uuid4().hex[:6].upper()}"
        ref_payload = {
            "id": new_ref_id,
            "care_episode_id": care_episode_id,
            "patient_id": existing_patient_id,
            "from_facility_id": "MED-WB-FAC-000372",
            "to_facility_id": "MED-WB-FAC-000349",
            "current_state": "SENT",
            "reason": "Severe acute respiratory distress requiring tertiary evaluation",
            "priority": "CRITICAL",
            "created_at": "2026-09-10T03:00:00Z",
            "created_by": "demo-asha-001",
            "sync_status": "synced",
        }
        res = await client.post("/referrals", json=ref_payload, headers=headers_asha)
        assert res.status_code in [200, 201], f"Referral creation failed: {res.text}"
        created_ref = res.json()
        assert created_ref["id"] == new_ref_id
        assert created_ref["current_state"] == "SENT"
        print(f"[PASS] 4. Referral Creation: Created new referral {new_ref_id} (SENT)")

        # 5. Referral State Machine Workflow
        # SENT -> RECEIVED
        res = await client.patch(
            f"/referrals/{new_ref_id}/transition",
            json={"id": str(uuid.uuid4()), "to_state": "RECEIVED", "note": "Received at PHC"},
            headers=headers_doc,
        )
        assert res.status_code == 200, f"Transition RECEIVED failed: {res.text}"
        print(f"[PASS] 5a. Transition: SENT -> RECEIVED for {new_ref_id}")

        # RECEIVED -> ACCEPTED
        res = await client.patch(
            f"/referrals/{new_ref_id}/transition",
            json={"id": str(uuid.uuid4()), "to_state": "ACCEPTED", "note": "Accepted by Medical Officer"},
            headers=headers_doc,
        )
        assert res.status_code == 200, f"Transition ACCEPTED failed: {res.text}"
        print(f"[PASS] 5b. Transition: RECEIVED -> ACCEPTED for {new_ref_id}")

        # ACCEPTED -> EMERGENCY_ESCALATED
        res = await client.patch(
            f"/referrals/{new_ref_id}/transition",
            json={"id": str(uuid.uuid4()), "to_state": "EMERGENCY_ESCALATED", "note": "Escalated to Tertiary Hospital"},
            headers=headers_doc,
        )
        assert res.status_code == 200, f"Transition EMERGENCY_ESCALATED failed: {res.text}"
        print(f"[PASS] 5c. Transition: ACCEPTED -> EMERGENCY_ESCALATED for {new_ref_id}")

        # 6. Follow-up Tasks Query
        res = await client.get("/continuity/follow-ups", headers=headers_asha)
        assert res.status_code == 200, f"Follow-ups query failed: {res.text}"
        followups = res.json()
        assert len(followups) >= 50, f"Expected >=50 follow-up tasks, got {len(followups)}"
        print(f"[PASS] 6. Continuity Service: {len(followups)} follow-up tasks retrieved")

        # 7. Dashboard Aggregation
        res = await client.get("/dashboard/facility", headers=headers_off)
        assert res.status_code == 200, f"Dashboard aggregation failed: {res.text}"
        dash_data = res.json()
        assert "total_referrals" in dash_data
        print(f"[PASS] 7. District Dashboard Aggregation: Total Referrals = {dash_data['total_referrals']}")

    print("\n=== ALL MEDEXA CORE BUSINESS WORKFLOW & INTEGRATION CHECKS PASSED ===")

if __name__ == "__main__":
    asyncio.run(run_integration_tests())
