from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin

"""
New table, added after the WB Ultimate Data Package's synthetic
facility_services data surfaced a real gap: Facility's three static
service_availability/diagnostic_availability/medicine_availability
enum fields can only express ONE value each per facility, but real
facilities offer many distinct named services (General OPD, Maternal
Care, Emergency, etc.), each with its own availability and capacity
status that changes over time. This table is additive — it doesn't
replace Facility's static defaults, which remain the fallback when no
service-level record exists for a facility yet.
"""


class CapacityStatus(str, enum.Enum):
    AVAILABLE = "available"
    LIMITED = "limited"
    FULL = "full"


class FacilityService(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "facility_services"

    facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"), index=True)
    service_name: Mapped[str] = mapped_column(String(150), index=True)
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    capacity_status: Mapped[CapacityStatus] = mapped_column(
        SAEnum(CapacityStatus), default=CapacityStatus.AVAILABLE
    )
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True))
