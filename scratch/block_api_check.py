import os, json
import sys
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure the backend app can be imported
sys.path.append('d:/Applications/Medexa-New-Final/backend')

# Import the FastAPI application
from app.main import app

PATIENT_ID = "8fdccb8c-ab56-4596-9d9b-9d5daa04ae41"

async def main():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Login as Block Medical Officer (doctor.demo) - assuming this role
        login_res = await client.post("/auth/login", data={"username": "doctor.demo", "password": "demo1234"})
        if login_res.status_code != 200:
            print("Login failed", login_res.text)
            return
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        # Get all referrals visible to this role
        referrals_res = await client.get("/referrals", headers=headers)
        print("/referrals status", referrals_res.status_code)
        referrals = referrals_res.json()
        print(f"Total referrals returned: {len(referrals)}")
        # Find referral(s) with the patient ID
        matching = [r for r in referrals if r.get("patient_id") == PATIENT_ID]
        print("Matching referrals count", len(matching))
        for r in matching:
            print("Referral:", json.dumps(r, indent=2))
            ref_id = r["id"]
            # Get by ID
            detail = await client.get(f"/referrals/{ref_id}", headers=headers)
            print(f"GET /referrals/{ref_id} status", detail.status_code)
            print(json.dumps(detail.json(), indent=2))
            # Get by care episode
            episode_id = r.get("care_episode_id")
            if episode_id:
                ep_res = await client.get(f"/referrals/episode/{episode_id}", headers=headers)
                print(f"GET /referrals/episode/{episode_id} status", ep_res.status_code)
                print(json.dumps(ep_res.json(), indent=2))

if __name__ == "__main__":
    asyncio.run(main())
