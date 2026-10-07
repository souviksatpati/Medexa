from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.schemas.auth import TokenPayload
from app.models.user import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_roles(*allowed_roles: UserRole):
    """
    Role-based access control (Build Guide Section 11) — used as a route
    dependency, e.g. Depends(require_roles(UserRole.DISTRICT_OFFICER)).
    A worker's JWT simply won't satisfy a district-only endpoint; this is
    enforced server-side regardless of what the frontend renders.
    """

    def checker(user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not permitted to access this resource",
            )
        return user

    return checker
