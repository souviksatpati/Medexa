from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, patients, care_episodes, triage, referrals, facilities, dashboard, continuity

app = FastAPI(
    title="Medexa API",
    description=(
        "Backend for Medexa (SIH26133) — a digital care-continuity and "
        "referral-recovery layer across India's public-health referral "
        "chain. This OpenAPI schema is consumed directly by the frontend "
        "via openapi-typescript (`npm run gen:types`), so every field "
        "name and type here becomes a compile-time contract with the "
        "frontend. Clinical risk and continuity risk are deliberately "
        "separate concepts throughout this API — see "
        "MEDEXA_CANONICAL_PROJECT_CONTEXT.md Section 16."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(care_episodes.router)
app.include_router(triage.router)
app.include_router(referrals.router)
app.include_router(facilities.router)
app.include_router(dashboard.router)
app.include_router(continuity.router)


@app.get("/health")
async def health_check():
    """Used by Docker Compose's healthcheck and by the frontend's
    NetworkFirst PWA cache to detect true reachability, not just DNS
    resolution."""
    return {"status": "ok"}

