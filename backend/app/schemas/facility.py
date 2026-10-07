from pydantic import BaseModel, ConfigDict

from app.models.facility import FacilityType, AvailabilityLevel


class FacilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    facility_type: FacilityType | None
    district: str | None
    village_or_ward: str | None
    latitude: float | None
    longitude: float | None
    service_availability: AvailabilityLevel
    diagnostic_availability: AvailabilityLevel
    medicine_availability: AvailabilityLevel


class FacilityPathwayOption(BaseModel):
    """
    Matches the frontend's FacilityPathwayOption interface exactly
    (src/hooks/useFacilityPathway.ts) — Build Guide Section 6's
    affordability/care-pathway visibility feature.
    """

    facility_id: str
    facility_name: str
    distance_km: float
    service_availability: AvailabilityLevel
    diagnostic_availability: AvailabilityLevel
    medicine_availability: AvailabilityLevel
