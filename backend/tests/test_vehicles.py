"""Integration tests for vehicle create/list/get endpoints."""

import pytest

VEHICLES_URL = "/api/vehicles"

from tests.conftest import CIVIC


class TestCreateVehicle:
    def test_adds_a_vehicle(self, client, admin_headers):
        response = client.post(VEHICLES_URL, json=CIVIC, headers=admin_headers)

        assert response.status_code == 201
        body = response.json()
        assert isinstance(body["id"], int)
        assert body["make"] == "Honda"
        assert body["model"] == "Civic"
        assert body["category"] == "Sedan"
        assert body["price"] == 24500.0
        assert body["quantity"] == 5

    def test_each_vehicle_gets_a_unique_id(self, create_vehicle):
        first = create_vehicle()
        second = create_vehicle(model="Accord")

        assert first["id"] != second["id"]

    def test_quantity_defaults_to_zero(self, client, admin_headers):
        payload = {key: value for key, value in CIVIC.items() if key != "quantity"}

        response = client.post(VEHICLES_URL, json=payload, headers=admin_headers)

        assert response.json()["quantity"] == 0

    def test_text_fields_are_trimmed(self, create_vehicle):
        body = create_vehicle(make="  Honda ", model=" Civic  ")

        assert body["make"] == "Honda"
        assert body["model"] == "Civic"

    def test_any_logged_in_user_can_add_a_vehicle(self, client, user_headers):
        # The spec marks POST /api/vehicles as protected, not admin-only.
        response = client.post(VEHICLES_URL, json=CIVIC, headers=user_headers)

        assert response.status_code == 201

    def test_requires_authentication(self, client):
        assert client.post(VEHICLES_URL, json=CIVIC).status_code == 401

    @pytest.mark.parametrize(
        "overrides",
        [
            {"price": 0},
            {"price": -100},
            {"quantity": -1},
            {"make": ""},
            {"make": "   "},
            {"model": ""},
            {"category": ""},
            {"price": "lots"},
        ],
    )
    def test_rejects_invalid_payloads(self, client, admin_headers, overrides):
        response = client.post(VEHICLES_URL, json={**CIVIC, **overrides}, headers=admin_headers)

        assert response.status_code == 422

    def test_rejects_missing_required_fields(self, client, admin_headers):
        response = client.post(VEHICLES_URL, json={"make": "Honda"}, headers=admin_headers)

        assert response.status_code == 422


class TestListVehicles:
    def test_empty_inventory_returns_empty_list(self, client, user_headers):
        response = client.get(VEHICLES_URL, headers=user_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_lists_all_vehicles_sorted_by_make_then_model(self, client, user_headers, create_vehicle):
        create_vehicle(make="Toyota", model="Corolla")
        create_vehicle(make="Honda", model="Civic")
        create_vehicle(make="Honda", model="Accord")

        response = client.get(VEHICLES_URL, headers=user_headers)

        names = [(v["make"], v["model"]) for v in response.json()]
        assert names == [("Honda", "Accord"), ("Honda", "Civic"), ("Toyota", "Corolla")]

    def test_lists_sold_out_vehicles_too(self, client, user_headers, create_vehicle):
        # Sold-out cars stay listed so the UI can show a disabled Purchase button.
        create_vehicle(quantity=0)

        assert client.get(VEHICLES_URL, headers=user_headers).json()[0]["quantity"] == 0

    def test_requires_authentication(self, client):
        assert client.get(VEHICLES_URL).status_code == 401

    def test_rejects_an_invalid_token(self, client):
        response = client.get(VEHICLES_URL, headers={"Authorization": "Bearer nonsense"})

        assert response.status_code == 401
