# 16. Production Deployment Guide — Medexa

## Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11.0 or higher
- **PostgreSQL**: v15.0 or higher
- **Git**: v2.30 or higher

---

## 1. Environment Setup

Copy `.env.example` to `.env` in both root/backend:

### Backend `.env` (`backend/.env`)
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/medexa
SECRET_KEY=medexa-production-secret-key-change-in-prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

---

## 2. Database Migration & Data Seeding

Execute database setup commands from `backend/`:
```bash
cd backend
alembic upgrade head
$env:PYTHONPATH="." ; python scripts/import_wb_data.py --data-dir ../datasets/medexa_db_final
$env:PYTHONPATH="." ; python scripts/seed_operational_demo.py
```

Verify setup:
```bash
$env:PYTHONPATH="." ; python scripts/verify_dataset_integrity.py
```

---

## 3. Production Frontend Build

Build the static React PWA assets from `frontend/`:
```bash
cd frontend
npm install
npm run build
```
Output assets will be generated in `frontend/dist/`.

---

## 4. Running Local Production Server

### Start FastAPI Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Serve Frontend Bundle
Host `frontend/dist` via Nginx, Caddy, or static server:
```bash
npx serve -s frontend/dist -l 5173
```
