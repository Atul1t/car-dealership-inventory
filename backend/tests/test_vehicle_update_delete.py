"""Integration tests for PUT and DELETE /api/vehicles/{id}."""

from tests.conftest import find_vehicle

VEHICLES_URL = "/api/vehicles"


class TestUpdateVehicle:
    def test_updates_details(self, client, admin_headers, create_vehicle):
        vehicle = create_vehicle()

        response = client.put(
            f"{VEHICLES_URL}/{vehicle['id']}",
            json={"price": 23999.99, "category": "Compact"},
            headers=admin_headers,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["price"] == 23999.99
        assert body["category"] == "Compact"
        # Untouched fields keep their values.
        assert body["make"] == vehicle["make"]
        assert body["quantity"] == vehicle["quantity"]

    def test_update_is_persisted(self, client, admin_headers, user_headers, create_vehicle):
        vehicle = create_vehicle()
        client.put(f"{VEHICLES_URL}/{vehicle['id']}", json={"model": "Civic Type R"}, headers=admin_headers)

        fetched = find_vehicle(client, user_headers, vehicle["id"])

        assert fetched["model"] == "Civic Type R"

    def test_any_logged_in_user_can_update(self, client, user_headers, create_vehicle):
        # The spec marks PUT /api/vehicles/:id as protected, not admin-only.
        vehicle = create_vehicle()

        response = client.put(f"{VEHICLES_URL}/{vehicle['id']}", json={"price": 1}, headers=user_headers)

        assert response.status_code == 200

    def test_unknown_vehicle_is_404(self, client, admin_headers):
        response = client.put(f"{VEHICLES_URL}/9999", json={"price": 1000}, headers=admin_headers)

        assert response.status_code == 404

    def test_rejects_invalid_values(self, client, admin_headers, create_vehicle):
        vehicle = create_vehicle()

        response = client.put(f"{VEHICLES_URL}/{vehicle['id']}", json={"price": -5}, headers=admin_headers)

        assert response.status_code == 422

    def test_explicit_null_is_rejected(self, client, admin_headers, create_vehicle):
        vehicle = create_vehicle()

        response = client.put(f"{VEHICLES_URL}/{vehicle['id']}", json={"make": None}, headers=admin_headers)

        assert response.status_code == 422

    def test_requires_authentication(self, client, create_vehicle):
        vehicle = create_vehicle()

        assert client.put(f"{VEHICLES_URL}/{vehicle['id']}", json={"price": 1}).status_code == 401


class TestDeleteVehicle:
    def test_admin_can_delete(self, client, admin_headers, user_headers, create_vehicle):
        vehicle = create_vehicle()

        response = client.delete(f"{VEHICLES_URL}/{vehicle['id']}", headers=admin_headers)

        assert response.status_code == 204
        assert find_vehicle(client, user_headers, vehicle["id"]) is None

    def test_regular_user_cannot_delete(self, client, user_headers, create_vehicle):
        vehicle = create_vehicle()

        response = client.delete(f"{VEHICLES_URL}/{vehicle['id']}", headers=user_headers)

        assert response.status_code == 403
        assert find_vehicle(client, user_headers, vehicle["id"]) is not None

    def test_unknown_vehicle_is_404(self, client, admin_headers):
        assert client.delete(f"{VEHICLES_URL}/9999", headers=admin_headers).status_code == 404

    def test_requires_authentication(self, client, create_vehicle):
        vehicle = create_vehicle()

        assert client.delete(f"{VEHICLES_URL}/{vehicle['id']}").status_code == 401
