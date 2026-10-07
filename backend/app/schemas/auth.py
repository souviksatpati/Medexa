from pydantic import BaseModel

from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user id
    role: UserRole
    facility_id: str | None = None


class UserOut(BaseModel):
    id: str
    username: str
    full_name: str
    role: UserRole
    facility_id: str | None
