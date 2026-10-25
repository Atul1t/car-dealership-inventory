"""Integration tests for /api/auth endpoints."""

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"

VALID_USER = {"name": "Asha Rao", "email": "asha@example.com", "password": "password123"}


def register(client, **overrides):
    return client.post(REGISTER_URL, json={**VALID_USER, **overrides})


class TestRegister:
    def test_registers_a_new_user_as_regular_customer(self, client):
        response = register(client)

        assert response.status_code == 201
        body = response.json()
        assert body["email"] == "asha@example.com"
        assert body["name"] == "Asha Rao"
        assert body["role"] == "user"
        assert "id" in body

    def test_never_returns_the_password_or_its_hash(self, client):
        body = register(client).json()

        assert "password" not in body
        assert "hashed_password" not in body

    def test_cannot_self_register_as_admin(self, client):
        response = register(client, role="admin")

        assert response.status_code == 201
        assert response.json()["role"] == "user"

    def test_rejects_duplicate_email(self, client):
        register(client)

        response = register(client, name="Someone Else")

        assert response.status_code == 409
        assert response.json()["detail"] == "Email is already registered"

    def test_duplicate_check_is_case_insensitive(self, client):
        register(client)

        response = register(client, email="ASHA@Example.com")

        assert response.status_code == 409

    def test_rejects_invalid_email(self, client):
        assert register(client, email="not-an-email").status_code == 422

    def test_rejects_short_password(self, client):
        assert register(client, password="short").status_code == 422

    def test_rejects_blank_name(self, client):
        assert register(client, name="   ").status_code == 422


class TestLogin:
    def test_returns_bearer_token_and_user_for_valid_credentials(self, client):
        register(client)

        response = client.post(LOGIN_URL, json={"email": "asha@example.com", "password": "password123"})

        assert response.status_code == 200
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]
        assert body["user"]["email"] == "asha@example.com"

    def test_email_is_case_insensitive(self, client):
        register(client)

        response = client.post(LOGIN_URL, json={"email": "Asha@Example.COM", "password": "password123"})

        assert response.status_code == 200

    def test_rejects_wrong_password(self, client):
        register(client)

        response = client.post(LOGIN_URL, json={"email": "asha@example.com", "password": "wrong-pass"})

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    def test_rejects_unknown_email_with_same_message(self, client):
        response = client.post(LOGIN_URL, json={"email": "ghost@example.com", "password": "password123"})

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"


class TestCurrentUser:
    def test_returns_the_logged_in_user(self, client):
        register(client)
        token = client.post(LOGIN_URL, json={"email": "asha@example.com", "password": "password123"}).json()[
            "access_token"
        ]

        response = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == 200
        assert response.json()["email"] == "asha@example.com"

    def test_requires_a_token(self, client):
        assert client.get(ME_URL).status_code == 401

    def test_rejects_an_invalid_token(self, client):
        response = client.get(ME_URL, headers={"Authorization": "Bearer nonsense"})

        assert response.status_code == 401
