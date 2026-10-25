"""FastAPI dependencies: wiring services together and guarding routes."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.services.auth_service import AuthService
from app.services.exceptions import AuthenticationError, PermissionDeniedError
from app.services.vehicle_service import VehicleService

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


def require_admin(current_user: CurrentUser) -> User:
    if not current_user.is_admin:
        raise PermissionDeniedError("Admin privileges required")
    return current_user


AdminUser = Annotated[User, Depends(require_admin)]


def get_vehicle_service(db: DbSession) -> VehicleService:
    return VehicleService(VehicleRepository(db))


VehicleServiceDep = Annotated[VehicleService, Depends(get_vehicle_service)]
