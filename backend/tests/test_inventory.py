"""Integration tests for purchasing and restocking vehicles."""

import pytest

from tests.conftest import find_vehicle

VEHICLES_URL = "/api/vehicles"


def purchase_url(vehicle_id):
    return f"{VEHICLES_URL}/{vehicle_id}/purchase"


def restock_url(vehicle_id):
    return f"{VEHICLES_URL}/{vehicle_id}/restock"


def stock_of(client, headers, vehicle_id):
    return find_vehicle(client, headers, vehicle_id)["quantity"]


class TestPurchase:
    def test_purchase_decreases_quantity_by_one_by_default(self, client, user_headers, create_vehicle):
        vehicle = create_vehicle(quantity=3)

        response = client.post(purchase_url(vehicle["id"]), headers=user_headers)

        assert response.status_code == 200
        assert response.json()["quantity"] == 2
        assert stock_of(client, user_headers, vehicle["id"]) == 2

    def test_can_purchase_several_units(self, client, user_headers, create_vehicle):
        vehicle = create_vehicle(quantity=5)

        response = client.post(purchase_url(vehicle["id"]), json={"quantity": 3}, headers=user_headers)

        assert response.json()["quantity"] == 2

    def test_can_buy_the_last_unit(self, client, user_headers, create_vehicle):
        vehicle = create_vehicle(quantity=1)

        response = client.post(purchase_url(vehicle["id"]), headers=user_headers)

        assert response.status_code == 200
        assert response.json()["quantity"] == 0

    def test_out_of_stock_vehicle_cannot_be_purchased(self, client, user_headers, create_vehicle):
        vehicle = create_vehicle(quantity=0)

        response = client.post(purchase_url(vehicle["id"]), headers=user_headers)

        assert response.status_code == 400
        assert response.json()["detail"] == "Insufficient stock"

    def test_cannot_buy_more_than_available_and_stock_is_unchanged(self, client, user_headers, create_vehicle):
        vehicle = create_vehicle(quantity=2)

        response = client.post(purchase_url(vehicle["id"]), json={"quantity": 3}, headers=user_headers)

        assert response.status_code == 400
        assert stock_of(client, user_headers, vehicle["id"]) == 2

    def test_admins_can_purchase_too(self, client, admin_headers, create_vehicle):
        vehicle = create_vehicle(quantity=1)

        assert client.post(purchase_url(vehicle["id"]), headers=admin_headers).status_code == 200

    @pytest.mark.parametrize("quantity", [0, -1])
    def test_quantity_must_be_positive(self, client, user_headers, create_vehicle, quantity):
        vehicle = create_vehicle()

        response = client.post(purchase_url(vehicle["id"]), json={"quantity": quantity}, headers=user_headers)

        assert response.status_code == 422

    def test_unknown_vehicle_is_404(self, client, user_headers):
        assert client.post(purchase_url(9999), headers=user_headers).status_code == 404

    def test_requires_authentication(self, client, create_vehicle):
        vehicle = create_vehicle()

        assert client.post(purchase_url(vehicle["id"])).status_code == 401


class TestRestock:
    def test_admin_restock_increases_quantity(self, client, admin_headers, create_vehicle):
        vehicle = create_vehicle(quantity=2)

        response = client.post(restock_url(vehicle["id"]), json={"quantity": 10}, headers=admin_headers)

        assert response.status_code == 200
        assert response.json()["quantity"] == 12

    def test_restocking_a_sold_out_vehicle_makes_it_purchasable(
        self, client, admin_headers, user_headers, create_vehicle
    ):
        vehicle = create_vehicle(quantity=0)
        client.post(restock_url(vehicle["id"]), json={"quantity": 1}, headers=admin_headers)

        assert client.post(purchase_url(vehicle["id"]), headers=user_headers).status_code == 200

    def test_regular_user_cannot_restock(self, client, user_headers, create_vehicle):
        vehicle = create_vehicle(quantity=2)

        response = client.post(restock_url(vehicle["id"]), json={"quantity": 5}, headers=user_headers)

        assert response.status_code == 403
        assert stock_of(client, user_headers, vehicle["id"]) == 2

    @pytest.mark.parametrize("payload", [{}, {"quantity": 0}, {"quantity": -3}])
    def test_quantity_is_required_and_positive(self, client, admin_headers, create_vehicle, payload):
        vehicle = create_vehicle()

        response = client.post(restock_url(vehicle["id"]), json=payload, headers=admin_headers)

        assert response.status_code == 422

    def test_unknown_vehicle_is_404(self, client, admin_headers):
        response = client.post(restock_url(9999), json={"quantity": 1}, headers=admin_headers)

        assert response.status_code == 404

    def test_requires_authentication(self, client, create_vehicle):
        vehicle = create_vehicle()

        assert client.post(restock_url(vehicle["id"]), json={"quantity": 1}).status_code == 401
