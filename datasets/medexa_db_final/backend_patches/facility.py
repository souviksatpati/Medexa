from sqlalchemy import String, Float, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class FacilityType(str, enum.Enum):
    """
    Extended from the original 4-value enum after loading the real West
    Bengal public-health facility dataset. CHC (Community Health Centre)
    and STATE_HOSPITAL are genuinely distinct tiers in India's public
    health system, sitting between PHC/rural_hospital and
    district_hospital respectively — collapsing them into an existing
    bucket would misrepresent referral-pathway appropriateness (a CHC
    has different capacity/specialist expectations than a generic rural
    hospital). This is a deliberate schema extension, not scope creep:
    it reflects what the real data actually contains.
    """

    SUB_CENTRE = "sub_centre"
    PHC = "phc"
    CHC = "chc"                      # NEW — Community Health Centre
    RURAL_HOSPITAL = "rural_hospital"
    STATE_HOSPITAL = "state_hospital"  # NEW — state-run hospital, above CHC/rural, below district
    DISTRICT_HOSPITAL = "district_hospital"


class AvailabilityLevel(str, enum.Enum):
    AVAILABLE = "available"
    LIMITED = "limited"
    UNAVAILABLE = "unavailable"


class CoordinateStatus(str, enum.Enum):
    """
    Explicit, queryable coordinate provenance — added after discovering
    that 1,165 of 12,863 real facilities (all from the National Hospital
    Directory source) have no coordinates at all, and 3 more have a
    partial/invalid coordinate pair. The pathway-ranking logic in
    facilities.py's haversine calculation MUST check this field and
    exclude PRESENT-only facilities from distance-based ranking, or it
    will silently crash on facilities with null lat/lon.
    """

    PRESENT = "present"
    MISSING_OR_INVALID = "missing_or_invalid"


class Facility(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    FHIR resource: Organization/Location, simplified. Seeded from a
    reconciled union of two real sources: the All India Health Centres
    Directory (11,698 rows, real coordinates, coordinate-corrected —
    118 swapped lat/lon pairs fixed, 1 corrected via supplementary web
    source) and the National Hospital Directory (1,165 rows, rich
    metadata, zero coordinates). See MEDEXA_FINAL_DATABASE_SCHEMA.md for
    full provenance and the coordinate reconciliation audit trail.
    """

    __tablename__ = "facilities"

    name: Mapped[str] = mapped_column(String(255), index=True)
    facility_type: Mapped[FacilityType | None] = mapped_column(
        SAEnum(FacilityType), nullable=True  # null for ~96% of hospital-directory rows — genuinely unclassified in source
    )
    district: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    district_mapping_confident: Mapped[bool] = mapped_column(
        Boolean, default=True
    )  # False for 902 rows with ambiguous legacy district names (pre-2017 Bardhaman split)
    subdistrict: Mapped[str | None] = mapped_column(String(150), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    coordinate_status: Mapped[CoordinateStatus] = mapped_column(
        SAEnum(CoordinateStatus), default=CoordinateStatus.MISSING_OR_INVALID, index=True
    )
    coordinate_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coordinate_confidence: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Provenance — never silently merge/dedupe across sources; keep
    # each record traceable to where it came from (source_record_registry.csv)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_record_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    verification_status: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Hospital-directory-only fields (sparse — 96%+ null, see schema doc)
    facility_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    facility_care_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    medicine_system: Mapped[str | None] = mapped_column(String(50), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    mobile_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emergency_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    specialties_raw: Mapped[str | None] = mapped_column(String(4000), nullable=True)

    # Static default availability — real per-service granularity lives
    # in FacilityService below; these are fallback values when no
    # service-level record exists yet for a facility.
    service_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
    diagnostic_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
    medicine_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
