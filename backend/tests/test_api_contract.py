"""The API must expose exactly the endpoints listed in the kata requirements, no more and no less."""

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
    # Read from the generated OpenAPI schema, which lists every API operation.
    paths = create_app().openapi()["paths"]
    routes = {(method.upper(), path) for path, operations in paths.items() for method in operations}

    assert routes == REQUIRED_ENDPOINTS
