import os, json
import psycopg2

conn = psycopg2.connect(
    host='localhost',
    port=5432,
    dbname='medexa',
    user='medexa_user',
    password='medexa_pass'
)
cur = conn.cursor()
# Search referrals for patient ID prefix
prefix = '8fdc'
cur.execute("SELECT id, patient_id, care_episode_id, from_facility_id, to_facility_id, current_state, reason, priority, created_by, created_at FROM referrals WHERE patient_id LIKE %s", (prefix+'%',))
referrals = cur.fetchall()
print('Found referrals count:', len(referrals))
for r in referrals:
    print('Referral:', r)
    ref_id = r[0]
    # Transitions
    cur.execute("SELECT id, referral_id, from_state, to_state, created_at FROM referral_state_transitions WHERE referral_id = %s ORDER BY created_at", (ref_id,))
    trans = cur.fetchall()
    print('Transitions for', ref_id, ':', trans)
cur.close()
conn.close()
