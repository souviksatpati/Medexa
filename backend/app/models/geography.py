from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class District(Base):
    __tablename__ = "districts"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    state_code: Mapped[str] = mapped_column(String(20), index=True)
    state_name: Mapped[str] = mapped_column(String(100))
    district_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150), index=True)

    subdistricts: Mapped[list["Subdistrict"]] = relationship(
        back_populates="district", cascade="all, delete-orphan"
    )
    blocks: Mapped[list["Block"]] = relationship(
        back_populates="district", cascade="all, delete-orphan"
    )
    local_bodies: Mapped[list["LocalBody"]] = relationship(
        back_populates="district", cascade="all, delete-orphan"
    )
    locations: Mapped[list["Location"]] = relationship(
        back_populates="district", cascade="all, delete-orphan"
    )


class Subdistrict(Base):
    __tablename__ = "subdistricts"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    district_id: Mapped[str] = mapped_column(ForeignKey("districts.id"), index=True)
    district_code: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(150), index=True)
    subdistrict_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)

    district: Mapped["District"] = relationship(back_populates="subdistricts")
    locations: Mapped[list["Location"]] = relationship(back_populates="subdistrict")


class Block(Base):
    __tablename__ = "blocks"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    district_id: Mapped[str] = mapped_column(ForeignKey("districts.id"), index=True)
    district_code: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(150), index=True)
    block_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)

    district: Mapped["District"] = relationship(back_populates="blocks")
    locations: Mapped[list["Location"]] = relationship(back_populates="block")


class LocalBody(Base):
    __tablename__ = "local_bodies"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    district_id: Mapped[str] = mapped_column(ForeignKey("districts.id"), index=True)
    district_code: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    localbody_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)

    district: Mapped["District"] = relationship(back_populates="local_bodies")
    locations: Mapped[list["Location"]] = relationship(back_populates="local_body")


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    state_code: Mapped[str] = mapped_column(String(20), index=True)
    state_name: Mapped[str] = mapped_column(String(100))
    district_id: Mapped[str] = mapped_column(ForeignKey("districts.id"), index=True)
    district_code: Mapped[str] = mapped_column(String(20), index=True)
    subdistrict_id: Mapped[str | None] = mapped_column(
        ForeignKey("subdistricts.id"), nullable=True, index=True
    )
    subdistrict_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    block_id: Mapped[str | None] = mapped_column(
        ForeignKey("blocks.id"), nullable=True, index=True
    )
    block_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    local_body_id: Mapped[str | None] = mapped_column(
        ForeignKey("local_bodies.id"), nullable=True, index=True
    )
    localbody_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    village_code: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    village_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    census_2011_code: Mapped[str | None] = mapped_column(String(40), nullable=True)

    district: Mapped["District"] = relationship(back_populates="locations")
    subdistrict: Mapped["Subdistrict | None"] = relationship(back_populates="locations")
    block: Mapped["Block | None"] = relationship(back_populates="locations")
    local_body: Mapped["LocalBody | None"] = relationship(back_populates="locations")
