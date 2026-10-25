"""Tests for the database seeding helper used to bootstrap a demo environment."""

from sqlalchemy import func, select

from app.core.security import verify_password
from app.models import User, Vehicle
from app.scripts.seed import SAMPLE_VEHICLES, seed


def count(db, model):
    return db.scalar(select(func.count()).select_from(model))


def test_creates_an_admin_and_sample_vehicles(db_session):
    seed(db_session, admin_email="Boss@Dealer.com", admin_password="adminpass123")

    admin = db_session.scalar(select(User).where(User.email == "boss@dealer.com"))
    assert admin is not None
    assert admin.is_admin
    assert verify_password("adminpass123", admin.hashed_password)
    assert count(db_session, Vehicle) == len(SAMPLE_VEHICLES)


def test_is_idempotent(db_session):
    seed(db_session, admin_email="boss@dealer.com", admin_password="adminpass123")
    seed(db_session, admin_email="boss@dealer.com", admin_password="adminpass123")

    assert count(db_session, User) == 1
    assert count(db_session, Vehicle) == len(SAMPLE_VEHICLES)


def test_does_not_add_samples_to_a_non_empty_inventory(db_session):
    db_session.add(Vehicle(make="Kia", model="Seltos", category="SUV", price=15000, quantity=1))
    db_session.commit()

    seed(db_session, admin_email="boss@dealer.com", admin_password="adminpass123")

    assert count(db_session, Vehicle) == 1


def test_promotes_an_existing_account_with_the_admin_email(db_session, client):
    client.post(
        "/api/auth/register",
        json={"name": "Boss", "email": "boss@dealer.com", "password": "password123"},
    )

    seed(db_session, admin_email="boss@dealer.com", admin_password="adminpass123")

    admin = db_session.scalar(select(User).where(User.email == "boss@dealer.com"))
    assert admin.is_admin
