import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class CapacityStatus(str, enum.Enum):
    AVAILABLE = "available"
    LIMITED = "limited"
    FULL = "full"
    UNKNOWN = "unknown"


class FacilityService(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "facility_services"
    __table_args__ = (
        UniqueConstraint("facility_id", "service_name", name="uq_facility_service_name"),
    )

    facility_id: Mapped[str] = mapped_column(
        ForeignKey("facilities.id", ondelete="CASCADE"), index=True
    )
    service_name: Mapped[str] = mapped_column(String(150), index=True)
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    capacity_status: Mapped[CapacityStatus] = mapped_column(
        SAEnum(CapacityStatus), default=CapacityStatus.AVAILABLE, index=True
    )
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    facility: Mapped["Facility"] = relationship(back_populates="services")
