"""The API must expose exactly the endpoints listed in the kata requirements, no more and no less."""

from fastapi.routing import APIRoute

from app.main import create_app

REQUIRED_ENDPOINTS = {
    ("POST", "/api/auth/register"),
    ("POST", "/api/auth/login"),
    ("POST", "/api/vehicles"),
    ("GET", "/api/vehicles"),
    ("GET", "/api/vehicles/search"),
    ("PUT", "/api/vehicles/{vehicle_id}"),
    ("DELETE", "/api/vehicles/{vehicle_id}"),
    ("POST", "/api/vehicles/{vehicle_id}/purchase"),
    ("POST", "/api/vehicles/{vehicle_id}/restock"),
}


def test_exposes_exactly_the_required_endpoints():
    routes = {
        (method, route.path)
        for route in create_app().routes
        if isinstance(route, APIRoute)
        for method in route.methods
    }

    assert routes == REQUIRED_ENDPOINTS
