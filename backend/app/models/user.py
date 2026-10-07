import enum

from sqlalchemy import String, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class UserRole(str, enum.Enum):
    ASHA_WORKER = "asha_worker"
    DOCTOR = "doctor"
    DISTRICT_OFFICER = "district_officer"
    ADMIN = "admin"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Deliberately minimal — this is not a full identity system, just enough
    RBAC to demonstrate that an ASHA worker's view differs from a district
    officer's (Build Guide Section 11: "role-based access control... judges
    in health-tech notice it immediately").
    """

    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(200))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), index=True)
    facility_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
