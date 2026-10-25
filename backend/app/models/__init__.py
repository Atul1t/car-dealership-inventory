"""Import every model here so Base.metadata knows about all tables (used by Alembic and tests)."""

from app.models.user import User, UserRole

__all__ = ["User", "UserRole"]
