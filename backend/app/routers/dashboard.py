from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user import UserRole
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_aggregation import compute_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/facility",
    response_model=DashboardResponse,
    dependencies=[Depends(require_roles(UserRole.DISTRICT_OFFICER, UserRole.ADMIN))],
)
async def get_facility_dashboard(
    district: str | None = None,
    block: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Role-gated to district officers/admins only — an ASHA worker's token
    won't satisfy this endpoint (Build Guide Section 11's RBAC
    requirement, enforced here, not just hidden in the frontend nav).
    """
    return await compute_dashboard(db, district=district, block=block)
