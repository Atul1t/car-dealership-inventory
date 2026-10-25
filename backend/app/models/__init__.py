"""Import every model here so Base.metadata knows about all tables (used by Alembic and tests)."""

from app.models.user import User, UserRole
from app.models.vehicle import Vehicle

__all__ = ["User", "UserRole", "Vehicle"]
