"""Bootstrap an admin account and a demo inventory.

Run with:  python -m app.scripts.seed
Admin credentials come from ADMIN_EMAIL / ADMIN_PASSWORD (see .env.example).
Safe to run repeatedly.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import User, UserRole, Vehicle

# Prices are in Indian rupees (ex-showroom, approximate).
SAMPLE_VEHICLES: list[dict] = [
    {"make": "Maruti Suzuki", "model": "Swift", "category": "Hatchback", "price": 649000, "quantity": 12},
    {"make": "Maruti Suzuki", "model": "Brezza", "category": "SUV", "price": 834000, "quantity": 7},
    {"make": "Hyundai", "model": "Creta", "category": "SUV", "price": 1100000, "quantity": 5},
    {"make": "Hyundai", "model": "Verna", "category": "Sedan", "price": 1100000, "quantity": 4},
    {"make": "Tata", "model": "Nexon EV", "category": "Electric", "price": 1449000, "quantity": 3},
    {"make": "Tata", "model": "Punch", "category": "Hatchback", "price": 613000, "quantity": 0},
    {"make": "Mahindra", "model": "Thar", "category": "SUV", "price": 1135000, "quantity": 2},
    {"make": "Mahindra", "model": "Scorpio-N", "category": "SUV", "price": 1385000, "quantity": 6},
    {"make": "Honda", "model": "City", "category": "Sedan", "price": 1182000, "quantity": 5},
    {"make": "Toyota", "model": "Innova Hycross", "category": "MPV", "price": 1977000, "quantity": 3},
    {"make": "Kia", "model": "Seltos", "category": "SUV", "price": 1090000, "quantity": 0},
    {"make": "MG", "model": "Windsor EV", "category": "Electric", "price": 1399000, "quantity": 4},
]


def seed(db: Session, *, admin_email: str, admin_password: str) -> None:
    _ensure_admin(db, admin_email, admin_password)
    _ensure_sample_inventory(db)
    db.commit()


def _ensure_admin(db: Session, email: str, password: str) -> None:
    email = email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        db.add(User(name="Admin", email=email, hashed_password=hash_password(password), role=UserRole.ADMIN))
    elif not user.is_admin:
        user.role = UserRole.ADMIN.value


def _ensure_sample_inventory(db: Session) -> None:
    if db.scalar(select(func.count()).select_from(Vehicle)):
        return
    db.add_all(Vehicle(**vehicle) for vehicle in SAMPLE_VEHICLES)


def main() -> None:  # pragma: no cover - thin CLI wrapper
    from app.core.config import get_settings
    from app.db.session import SessionLocal

    settings = get_settings()
    with SessionLocal() as db:
        seed(db, admin_email=settings.admin_email, admin_password=settings.admin_password)
    print(f"Seeded admin {settings.admin_email} and sample inventory.")


if __name__ == "__main__":  # pragma: no cover
    main()
