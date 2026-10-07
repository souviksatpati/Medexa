import asyncio
import os
import sys
import httpx

sys.path.insert(0, os.path.abspath('backend'))

BASE_URL = "http://127.0.0.1:8000"

async def main():
    async with httpx.AsyncClient() as client:
        print("=" * 80)
        print("PHASE 2: TESTING BACKEND API DIRECTLY WITH BLOCK USER AUTH")
        print("=" * 80)
        
        # Login using form data for doctor.demo
        login_res = await client.post(f"{BASE_URL}/auth/login", data={"username": "doctor.demo", "password": "demo1234"})
        print(f"Login HTTP Status: {login_res.status_code}")
        
        token_data = login_res.json()
        token = token_data.get("access_token")
        print(f"Token acquired: {token[:20]}..." if token else "NO TOKEN!")
        
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        
        # 1. Call GET /auth/me
        me_res = await client.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"\nGET /auth/me HTTP Status: {me_res.status_code}")
        print(f"Decoded User Info: {me_res.json()}")
        
        # 2. Call GET /referrals
        ref_res = await client.get(f"{BASE_URL}/referrals", headers=headers)
        print(f"\nGET /referrals HTTP Status: {ref_res.status_code}")
        referrals = ref_res.json()
        print(f"Total referrals returned by backend: {len(referrals)}")
        
        # Check if fresh referral is present
        fresh_ref = next((r for r in referrals if r["id"] == "dcf56758-fbfb-4f21-8233-2006e9730d93" or r["patient_id"] == "8fdccb8c-ab56-4596-9dab-9d5daa04ae41"), None)
        
        print("\nFRESH REFERRAL IN BACKEND API RESPONSE:")
        if fresh_ref:
            print("  PRESENT IN API RESPONSE!")
            print(f"  ID: {fresh_ref['id']}")
            print(f"  patient_id: {fresh_ref['patient_id']}")
            print(f"  from_facility_id: {fresh_ref['from_facility_id']}")
            print(f"  to_facility_id: {fresh_ref['to_facility_id']}")
            print(f"  current_state: {fresh_ref['current_state']}")
            print(f"  priority: {fresh_ref.get('priority')}")
            print(f"  from_facility_name: {fresh_ref.get('from_facility_name')}")
            print(f"  to_facility_name: {fresh_ref.get('to_facility_name')}")
            print(f"  to_facility_subdistrict: {fresh_ref.get('to_facility_subdistrict')}")
        else:
            print("  NOT PRESENT IN API RESPONSE!")

        # 3. Call GET /referrals/{id}
        single_res = await client.get(f"{BASE_URL}/referrals/dcf56758-fbfb-4f21-8233-2006e9730d93", headers=headers)
        print(f"\nGET /referrals/dcf56758... Status: {single_res.status_code}")
        if single_res.status_code == 200:
            print("Single referral fetch succeeded!")
            print(f"Single Referral Data: {single_res.json()}")

if __name__ == "__main__":
    asyncio.run(main())
