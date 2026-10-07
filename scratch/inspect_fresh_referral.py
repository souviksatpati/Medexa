import os
import psycopg2
import json

conn = psycopg2.connect(
    host='localhost',
    port=5432,
    dbname='medexa',
    user='medexa_user',
    password='medexa_pass'
)
cur = conn.cursor()
patient_id = '8fdccb8c-ab56-4596-9d9b-5d5daa04ae41'
# Show patient columns
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='patients'")
patient_cols = [row[0] for row in cur.fetchall()]
print('PATIENT columns:', patient_cols)
# Fetch patient record (all columns)
cur.execute(f"SELECT * FROM patients WHERE id = %s", (patient_id,))
patient = cur.fetchone()
print('PATIENT record:', patient)
# Care episodes for patient
cur.execute("SELECT id, patient_id FROM care_episodes WHERE patient_id = %s", (patient_id,))
episodes = cur.fetchall()
print('CARE_EPISODES:', episodes)
# Referrals for patient
cur.execute("SELECT id, patient_id, care_episode_id, from_facility_id, to_facility_id, current_state, reason, priority, created_by, created_at FROM referrals WHERE patient_id = %s", (patient_id,))
referrals = cur.fetchall()
print('REFERRALS:', referrals)
# For each referral, get transitions
for ref in referrals:
    ref_id = ref[0]
    cur.execute("SELECT id, referral_id, from_state, to_state, created_at FROM referral_state_transitions WHERE referral_id = %s ORDER BY created_at", (ref_id,))
    transitions = cur.fetchall()
    print(f'TRANSITIONS for {ref_id}:', transitions)
cur.close()
conn.close()
