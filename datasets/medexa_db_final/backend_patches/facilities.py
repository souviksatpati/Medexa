import math

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.facility import Facility, CoordinateStatus
from app.schemas.facility import FacilityOut, FacilityPathwayOption

router = APIRouter(prefix="/facilities", tags=["facilities"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


@router.get("", response_model=list[FacilityOut])
async def list_facilities(district: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Facility)
    if district:
        stmt = stmt.where(Facility.district == district)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{facility_id}/pathway-options", response_model=list[FacilityPathwayOption])
async def get_pathway_options(facility_id: str, db: AsyncSession = Depends(get_db)):
    """
    Care-Pathway Visibility. Ranks nearby facilities by a blend of
    availability and distance.

    CRITICAL FIX vs. the pre-real-data version: 1,168 of 12,863 real
    facilities (1,165 hospital-directory records + 3 unresolved public
    facilities) have no usable coordinates. The original haversine-only
    implementation would either crash on None or silently produce
    nonsense distances if a null slipped through. This version filters
    to CoordinateStatus.PRESENT before ranking, and if the origin
    facility itself has no coordinates, returns a 422 explaining exactly
    why rather than a confusing 500 or an empty list with no context.
    """
    origin = await db.get(Facility, facility_id)
    if origin is None:
        raise HTTPException(status_code=404, detail="Facility not found")
    if origin.coordinate_status != CoordinateStatus.PRESENT or origin.latitude is None:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Facility '{origin.name}' has no usable coordinates "
                f"(source: {origin.source}), so distance-based pathway "
                f"ranking cannot run from this facility. See "
                f"medexa_wb_facility_coordinate_gaps.csv for the full "
                f"list of affected facilities."
            ),
        )

    result = await db.execute(
        select(Facility)
        .where(Facility.id != facility_id)
        .where(Facility.coordinate_status == CoordinateStatus.PRESENT)
        .where(Facility.latitude.is_not(None))
        .where(Facility.longitude.is_not(None))
    )
    candidates = list(result.scalars().all())

    def availability_score(f: Facility) -> int:
        levels = {"available": 0, "limited": 1, "unavailable": 2}
        return (
            levels[f.service_availability.value]
            + levels[f.diagnostic_availability.value]
            + levels[f.medicine_availability.value]
        )

    options = [
        (f, _haversine_km(origin.latitude, origin.longitude, f.latitude, f.longitude))
        for f in candidates
    ]
    options.sort(key=lambda pair: (availability_score(pair[0]), pair[1]))

    return [
        FacilityPathwayOption(
            facility_id=f.id,
            facility_name=f.name,
            distance_km=round(distance, 1),
            service_availability=f.service_availability,
            diagnostic_availability=f.diagnostic_availability,
            medicine_availability=f.medicine_availability,
        )
        for f, distance in options[:5]
    ]
