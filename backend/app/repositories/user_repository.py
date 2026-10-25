"""Data access for users. The only module that talks to the users table."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self._db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self._db.scalar(select(User).where(User.email == email.lower()))

    def add(self, *, name: str, email: str, hashed_password: str, role: UserRole = UserRole.USER) -> User:
        user = User(name=name, email=email.lower(), hashed_password=hashed_password, role=role.value)
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user
