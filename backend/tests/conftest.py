"""Shared pytest fixtures.

Tests run against the database in TEST_DATABASE_URL (PostgreSQL in CI / docker-compose).
If it's not set, a throwaway SQLite file is used so the suite runs with zero setup.
"""

import os
from collections.abc import Iterator

# Must be set before app settings are first read (they are cached).
os.environ.setdefault("BCRYPT_ROUNDS", "4")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import app.models  # noqa: F401  (registers all tables on Base.metadata)
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite:///./test.db")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def _create_schema() -> Iterator[None]:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_tables() -> Iterator[None]:
    """Empty every table after each test so tests never leak state into one another."""
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture
def db_session() -> Iterator[Session]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> Iterator[TestClient]:
    app = create_app()

    def override_get_db() -> Iterator[Session]:
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def _login_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def user_headers(client: TestClient) -> dict[str, str]:
    """Authorization header for a freshly registered regular customer."""
    client.post(
        "/api/auth/register",
        json={"name": "Regular User", "email": "user@example.com", "password": "password123"},
    )
    return _login_headers(client, "user@example.com", "password123")


@pytest.fixture
def admin_headers(client: TestClient, db_session: Session) -> dict[str, str]:
    """Authorization header for an admin. Admins can't self-register, so insert one directly."""
    from app.core.security import hash_password
    from app.models.user import UserRole
    from app.repositories.user_repository import UserRepository

    UserRepository(db_session).add(
        name="Admin",
        email="admin@example.com",
        hashed_password=hash_password("adminpass123"),
        role=UserRole.ADMIN,
    )
    return _login_headers(client, "admin@example.com", "adminpass123")


# ---------------------------------------------------------------------------
# Vehicle helpers
# ---------------------------------------------------------------------------

CIVIC = {"make": "Honda", "model": "Civic", "category": "Sedan", "price": 24500.0, "quantity": 5}


@pytest.fixture
def create_vehicle(client: TestClient, admin_headers: dict[str, str]):
    """Factory that creates a vehicle through the API as an admin and returns the JSON body."""

    def _create(**overrides):
        response = client.post("/api/vehicles", json={**CIVIC, **overrides}, headers=admin_headers)
        assert response.status_code == 201, response.text
        return response.json()

    return _create


def find_vehicle(client: TestClient, headers: dict[str, str], vehicle_id: int) -> dict | None:
    """Look a vehicle up through GET /api/vehicles (the spec has no get-by-id endpoint)."""
    response = client.get("/api/vehicles", headers=headers)
    assert response.status_code == 200, response.text
    return next((v for v in response.json() if v["id"] == vehicle_id), None)
