"""Integration tests for GET /api/vehicles/search."""

import pytest

SEARCH_URL = "/api/vehicles/search"


@pytest.fixture
def showroom(create_vehicle):
    """A small, varied inventory to search against."""
    create_vehicle(make="Honda", model="Civic", category="Sedan", price=24500)
    create_vehicle(make="Honda", model="CR-V", category="SUV", price=32000)
    create_vehicle(make="Toyota", model="Corolla", category="Sedan", price=22000)
    create_vehicle(make="Tesla", model="Model 3", category="Electric", price=42000)
    create_vehicle(make="Ford", model="F-150", category="Truck", price=38000)


def models_in(response):
    return sorted(vehicle["model"] for vehicle in response.json())


def search(client, headers, **params):
    return client.get(SEARCH_URL, params=params, headers=headers)


class TestSearchVehicles:
    def test_by_make_is_partial_and_case_insensitive(self, client, user_headers, showroom):
        response = search(client, user_headers, make="hon")

        assert response.status_code == 200
        assert models_in(response) == ["CR-V", "Civic"]

    def test_by_model(self, client, user_headers, showroom):
        assert models_in(search(client, user_headers, model="model")) == ["Model 3"]

    def test_by_category_is_case_insensitive(self, client, user_headers, showroom):
        assert models_in(search(client, user_headers, category="sedan")) == ["Civic", "Corolla"]

    def test_by_category_matches_whole_category_only(self, client, user_headers, showroom):
        # "Sedan" must not match a partial like "Se"; categories are exact labels.
        assert models_in(search(client, user_headers, category="se")) == []

    def test_by_minimum_price_is_inclusive(self, client, user_headers, showroom):
        assert models_in(search(client, user_headers, min_price=38000)) == ["F-150", "Model 3"]

    def test_by_maximum_price_is_inclusive(self, client, user_headers, showroom):
        assert models_in(search(client, user_headers, max_price=24500)) == ["Civic", "Corolla"]

    def test_by_price_range(self, client, user_headers, showroom):
        result = search(client, user_headers, min_price=23000, max_price=40000)

        assert models_in(result) == ["CR-V", "Civic", "F-150"]

    def test_filters_combine_with_and(self, client, user_headers, showroom):
        result = search(client, user_headers, make="honda", category="SUV", max_price=35000)

        assert models_in(result) == ["CR-V"]

    def test_no_filters_returns_everything(self, client, user_headers, showroom):
        assert len(search(client, user_headers).json()) == 5

    def test_no_matches_returns_empty_list(self, client, user_headers, showroom):
        assert search(client, user_headers, make="Ferrari").json() == []

    def test_blank_text_filters_are_ignored(self, client, user_headers, showroom):
        assert len(search(client, user_headers, make="  ").json()) == 5

    def test_min_price_above_max_price_is_rejected(self, client, user_headers):
        response = search(client, user_headers, min_price=50000, max_price=10000)

        assert response.status_code == 400
        assert response.json()["detail"] == "min_price cannot be greater than max_price"

    def test_negative_price_is_rejected(self, client, user_headers):
        assert search(client, user_headers, min_price=-1).status_code == 422

    def test_requires_authentication(self, client):
        assert client.get(SEARCH_URL).status_code == 401


class TestSearchWildcards:
    @pytest.mark.parametrize("term", ["%", "_", "Hon%a"])
    def test_sql_wildcards_are_treated_literally(self, client, user_headers, showroom, term):
        assert search(client, user_headers, make=term).json() == []

    def test_literal_special_characters_still_match(self, client, user_headers, showroom):
        assert models_in(search(client, user_headers, model="CR-V")) == ["CR-V"]
