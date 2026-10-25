"""Password hashing and JWT helpers.

Kept free of FastAPI/DB imports so it can be unit-tested in isolation.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import get_settings


class InvalidTokenError(Exception):
    """Raised when a token is expired, tampered with or malformed."""


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt(rounds=get_settings().bcrypt_rounds)).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def create_access_token(subject: str, role: str, expires_in: timedelta | None = None) -> str:
    settings = get_settings()
    expires_in = expires_in or timedelta(minutes=settings.jwt_expire_minutes)
    now = datetime.now(UTC)
    payload = {"sub": subject, "role": role, "iat": now, "exp": now + expires_in}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
