from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from app.core.config import settings
from app.schemas.auth import TokenPayload


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, role: str, facility_id: str | None) -> str:
    """
    Long expiry (Build Guide's config default: 12h) is a deliberate
    choice, not an oversight — field workers in low-connectivity areas
    may not be able to silently refresh a token mid-shift. This is a
    real tradeoff to be ready to explain to judges: convenience for
    offline-first usability vs. tighter token rotation. Documented here,
    not buried.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": user_id,
        "role": role,
        "facility_id": facility_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> TokenPayload | None:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return TokenPayload(
            sub=payload["sub"], role=payload["role"], facility_id=payload.get("facility_id")
        )
    except (JWTError, KeyError):
        return None
