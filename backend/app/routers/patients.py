from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.patient import Patient
from app.models.audit_log import AuditLog
from app.schemas.patient import PatientCreate, PatientOut
from app.schemas.auth import TokenPayload

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=201)
async def create_patient(
    payload: PatientCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Idempotent on id: since offline-created records use a client-generated
    UUID (Build Guide Section 8 Stage D), a retried sync push must not
    create a duplicate. If the id already exists, treat this as a no-op
    update rather than erroring — a real edge case in a sync system,
    worth having a tested answer for in Q&A.
    """
    existing = await db.get(Patient, payload.id)
    if existing is not None:
        return existing

    patient = Patient(
        id=payload.id,
        full_name=payload.full_name,
        age=payload.age,
        sex=payload.sex,
        village_or_ward=payload.village_or_ward,
        phone=payload.phone,
        chronic_conditions=payload.chronic_conditions,
    )
    db.add(patient)
    db.add(
        AuditLog(
            entity_type="patient",
            entity_id=patient.id,
            action="create",
            changed_by=current_user.sub,
            changed_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: str,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    patient = await db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("", response_model=list[PatientOut])
async def search_patients(
    q: str | None = None,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Simple name/village search — sufficient for the demo; a production
    version would add full-text search, not in scope per Build Guide's
    exclusion list.
    """
    stmt = select(Patient)
    if q:
        stmt = stmt.where(Patient.full_name.ilike(f"%{q}%"))
    result = await db.execute(stmt.limit(50))
    return list(result.scalars().all())
