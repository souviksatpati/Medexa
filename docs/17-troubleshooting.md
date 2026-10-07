# 17. Diagnostics & Troubleshooting — Medexa

## Common Diagnostic Procedures

### 1. Database Connection Failure
- **Symptom**: `sqlalchemy.exc.OperationalError` or `asyncpg.exceptions.CannotConnectNowError`.
- **Diagnosis**: Verify PostgreSQL server status and port 5432 availability.
- **Fix**:
  ```bash
  # Check PostgreSQL connection in PowerShell
  Test-NetConnection -ComputerName localhost -Port 5432
  ```

### 2. JWT Authentication / 401 Unauthorized Error
- **Symptom**: Frontend network requests return `401 Unauthorized`.
- **Diagnosis**: Token missing or expired in `localStorage["auth_token"]`.
- **Fix**: Clear browser storage or re-authenticate using official demo credentials (`ASHA-WB-401` / `1234`).

### 3. Triage Submission Validation Error (HTTP 422)
- **Symptom**: Triage submission returns `422 Unprocessable Entity`.
- **Diagnosis**: Vitals field key format mismatch or `clinical_risk_level` casing.
- **Fix**: Verify `syncEngine.ts` pushOne mapping translates `vitals` keys to `snake_case` and `clinical_risk_level` to `UPPERCASE`.

### 4. Stuck Offline Sync Queue
- **Symptom**: "N records pending sync" badge remains constant despite active internet connection.
- **Diagnosis**: Inspection of `db.syncQueue` in DevTools → Application → IndexedDB.
- **Fix**: Check `lastError` field in `syncQueue` table to identify failing endpoint payloads.
