"""Service-layer unit tests using in-memory fakes instead of a database.

Services depend only on the repository interface, so the business rules can be
exercised without SQL — including race conditions that are hard to trigger
through the HTTP API.
"""

from types import SimpleNamespace

import pytest

from app.core.security import create_access_token
from app.schemas.vehicle import VehicleSearchCriteria
from app.services.auth_service import AuthService
from app.services.exceptions import AuthenticationError, BusinessRuleError, NotFoundError
from app.services.vehicle_service import VehicleService


class FakeUserRepository:
    def __init__(self, users=None):
        self.users = {user.id: user for user in users or []}

    def get_by_id(self, user_id):
        return self.users.get(user_id)

    def get_by_email(self, email):
        return next((u for u in self.users.values() if u.email == email.lower()), None)


class FakeVehicleRepository:
    def __init__(self, vehicles=None):
        self.vehicles = {v.id: v for v in vehicles or []}
        self.search_calls = []
        self.vanish_on_increment = False

    def get(self, vehicle_id):
        return self.vehicles.get(vehicle_id)

    def search(self, **filters):
        self.search_calls.append(filters)
        return []

    def decrement_stock(self, vehicle_id, amount):
        vehicle = self.vehicles[vehicle_id]
        if vehicle.quantity < amount:
            return False
        vehicle.quantity -= amount
        return True

    def increment_stock(self, vehicle_id, amount):
        if self.vanish_on_increment:
            return False
        self.vehicles[vehicle_id].quantity += amount
        return True

    def refresh(self, vehicle):
        return vehicle


def make_vehicle(vehicle_id=1, quantity=3):
    return SimpleNamespace(id=vehicle_id, quantity=quantity)


class TestAuthServiceTokens:
    def test_token_for_a_deleted_user_is_rejected(self):
        service = AuthService(FakeUserRepository())
        token = create_access_token(subject="123", role="user")

        with pytest.raises(AuthenticationError):
            service.user_from_token(token)

    def test_token_with_non_numeric_subject_is_rejected(self):
        service = AuthService(FakeUserRepository())
        token = create_access_token(subject="not-a-number", role="user")

        with pytest.raises(AuthenticationError):
            service.user_from_token(token)


class TestVehicleServiceStock:
    def test_purchase_reduces_stock(self):
        vehicle = make_vehicle(quantity=3)
        service = VehicleService(FakeVehicleRepository([vehicle]))

        assert service.purchase(1, 2).quantity == 1

    def test_purchase_beyond_stock_raises_and_keeps_quantity(self):
        vehicle = make_vehicle(quantity=1)
        service = VehicleService(FakeVehicleRepository([vehicle]))

        with pytest.raises(BusinessRuleError, match="Insufficient stock"):
            service.purchase(1, 2)
        assert vehicle.quantity == 1

    def test_purchase_unknown_vehicle_raises_not_found(self):
        with pytest.raises(NotFoundError):
            VehicleService(FakeVehicleRepository()).purchase(99)

    def test_restock_of_vehicle_deleted_mid_request_raises_not_found(self):
        repo = FakeVehicleRepository([make_vehicle()])
        repo.vanish_on_increment = True

        with pytest.raises(NotFoundError):
            VehicleService(repo).restock(1, 5)


class TestVehicleServiceSearch:
    def test_passes_cleaned_criteria_to_repository(self):
        repo = FakeVehicleRepository()
        criteria = VehicleSearchCriteria(make=" Honda ", category="  ", min_price=100)

        VehicleService(repo).search(criteria)

        assert repo.search_calls == [
            {"make": "Honda", "model": None, "category": None, "min_price": 100, "max_price": None}
        ]

    def test_equal_min_and_max_price_is_allowed(self):
        criteria = VehicleSearchCriteria(min_price=500, max_price=500)

        assert VehicleService(FakeVehicleRepository()).search(criteria) == []
