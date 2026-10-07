from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class Encounter(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """FHIR resource: Encounter. A single visit/interaction within a
    Care Episode — e.g. the initial ASHA visit, a PHC consultation, a
    follow-up visit. Multiple encounters can belong to one episode."""

    __tablename__ = "encounters"

    care_episode_id: Mapped[str] = mapped_column(
        ForeignKey("care_episodes.id"), index=True
    )
    facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"))
    performed_by: Mapped[str] = mapped_column(String(36))  # user id
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    care_episode: Mapped["CareEpisode"] = relationship(back_populates="encounters")
