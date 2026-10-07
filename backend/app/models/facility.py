import enum
from datetime import datetime

from sqlalchemy import Boolean, Float, String, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class FacilityType(str, enum.Enum):
    SUB_CENTRE = "sub_centre"
    PHC = "phc"
    CHC = "chc"
    RURAL_HOSPITAL = "rural_hospital"
    STATE_HOSPITAL = "state_hospital"
    DISTRICT_HOSPITAL = "district_hospital"


class AvailabilityLevel(str, enum.Enum):
    AVAILABLE = "available"
    LIMITED = "limited"
    UNAVAILABLE = "unavailable"


class CoordinateStatus(str, enum.Enum):
    PRESENT = "present"
    MISSING_IN_SUPPLIED_SOURCE = "missing_in_supplied_source"
    MISSING_OR_INVALID = "missing_or_invalid"


class Facility(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Facility master record with explicit provenance and coordinate quality.

    Geography is intentionally stored as source identifiers/names for now;
    the authoritative LGD hierarchy is represented by the geography tables.
    Facility records preserve source provenance and do not manufacture
    coordinates when the source has none.
    """

    __tablename__ = "facilities"

    name: Mapped[str] = mapped_column(String(255), index=True)
    facility_type: Mapped[FacilityType | None] = mapped_column(
        SAEnum(FacilityType), nullable=True, index=True
    )
    ownership: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    village_or_ward: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    district_mapping_confident: Mapped[bool] = mapped_column(Boolean, default=True)
    subdistrict: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    pincode: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    coordinate_status: Mapped[CoordinateStatus] = mapped_column(
        SAEnum(CoordinateStatus), default=CoordinateStatus.MISSING_OR_INVALID, index=True
    )
    coordinate_confidence: Mapped[str | None] = mapped_column(String(50), nullable=True)
    coordinate_source: Mapped[str | None] = mapped_column(String(150), nullable=True)

    source: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    source_record_id: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    verification_status: Mapped[str | None] = mapped_column(String(100), nullable=True)

    facility_category: Mapped[str | None] = mapped_column(String(150), nullable=True)
    facility_care_type: Mapped[str | None] = mapped_column(String(150), nullable=True)
    medicine_system: Mapped[str | None] = mapped_column(String(100), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mobile_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emergency_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    specialties_raw: Mapped[str | None] = mapped_column(String(4000), nullable=True)

    service_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
    diagnostic_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
    medicine_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )

    services: Mapped[list["FacilityService"]] = relationship(
        back_populates="facility", cascade="all, delete-orphan"
    )
