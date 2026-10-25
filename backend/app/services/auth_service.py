"""Registration, login and token-to-user resolution."""

from app.core.security import (
    InvalidTokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.exceptions import AuthenticationError, ConflictError

INVALID_CREDENTIALS = "Invalid email or password"


class AuthService:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    def register(self, *, name: str, email: str, password: str) -> User:
        if self._users.get_by_email(email):
            raise ConflictError("Email is already registered")
        return self._users.add(name=name, email=email, hashed_password=hash_password(password))

    def login(self, *, email: str, password: str) -> tuple[str, User]:
        """Return (access_token, user). Same error for unknown email and wrong password,
        so the endpoint can't be used to discover which emails are registered."""
        user = self._users.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise AuthenticationError(INVALID_CREDENTIALS)
        token = create_access_token(subject=str(user.id), role=user.role)
        return token, user

    def user_from_token(self, token: str) -> User:
        try:
            payload = decode_access_token(token)
            user_id = int(payload["sub"])
        except (InvalidTokenError, KeyError, ValueError) as exc:
            raise AuthenticationError("Invalid or expired token") from exc

        user = self._users.get_by_id(user_id)
        if user is None:
            raise AuthenticationError("Invalid or expired token")
        return user
