"""FastAPI dependencies: wiring services together and guarding routes."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.exceptions import AuthenticationError

DbSession = Annotated[Session, Depends(get_db)]

# auto_error=False so a missing header goes through our own 401 handling.
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(db: DbSession) -> AuthService:
    return AuthService(UserRepository(db))


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    if credentials is None:
        raise AuthenticationError("Not authenticated")
    return auth_service.user_from_token(credentials.credentials)


CurrentUser = Annotated[User, Depends(get_current_user)]
