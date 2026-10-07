from sqlalchemy import String, Integer, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class Sex(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Patient(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """FHIR resource: Patient. Field names deliberately mirror FHIR's
    Patient resource shape (Build Guide Section 8 Stage F) — this is what
    lets us say "FHIR-aligned architecture" honestly without claiming
    production ABDM integration."""

    __tablename__ = "patients"

    full_name: Mapped[str] = mapped_column(String(200))
    age: Mapped[int] = mapped_column(Integer)
    sex: Mapped[Sex] = mapped_column(SAEnum(Sex))
    village_or_ward: Mapped[str] = mapped_column(String(150), index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    chronic_conditions: Mapped[list[str]] = mapped_column(JSON, default=list)

    care_episodes: Mapped[list["CareEpisode"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
