from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.facility import Facility
from app.schemas.auth import TokenPayload
from app.schemas.facility import FacilityOut, FacilityPathwayOption
from app.services.facility_pathway import rank_pathway_options


router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("", response_model=list[FacilityOut])
async def list_facilities(
    district: str | None = None,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Facility)

    if district:
        stmt = stmt.where(Facility.district == district)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/{facility_id}/pathway-options",
    response_model=list[FacilityPathwayOption],
)
async def get_pathway_options(
    facility_id: str,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Build Guide Section 6: Care-Pathway Visibility.

    Pathway candidates are ranked by current availability first,
    with geographic distance used as the tie-breaker.
    """
    origin = await db.get(Facility, facility_id)

    if (
        origin is None
        or origin.latitude is None
        or origin.longitude is None
    ):
        raise HTTPException(
            status_code=404,
            detail="Facility not found or missing coordinates",
        )

    result = await db.execute(
        select(Facility)
        .where(Facility.id != facility_id)
        .where(Facility.latitude.is_not(None))
        .where(Facility.longitude.is_not(None))
    )

    candidates = list(result.scalars().all())
    ranked = rank_pathway_options(origin, candidates, limit=5)

    return [
        FacilityPathwayOption(
            facility_id=facility.id,
            facility_name=facility.name,
            distance_km=round(distance, 1),
            service_availability=facility.service_availability,
            diagnostic_availability=facility.diagnostic_availability,
            medicine_availability=facility.medicine_availability,
        )
        for facility, distance in ranked
    ]
