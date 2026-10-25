"""Integration tests for /api/auth endpoints."""

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"

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


class TestTokenUsage:
    def test_login_token_unlocks_protected_endpoints(self, client):
        register(client)
        token = client.post(LOGIN_URL, json={"email": "asha@example.com", "password": "password123"}).json()[
            "access_token"
        ]

        response = client.get("/api/vehicles", headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == 200


class TestPasswordLimits:
    def test_rejects_password_longer_than_bcrypt_limit(self, client):
        # bcrypt only accepts up to 72 bytes; longer input must be a 422, not a 500.
        assert register(client, password="a" * 73).status_code == 422

    def test_byte_limit_counts_multibyte_characters(self, client):
        assert register(client, password="é" * 37).status_code == 422  # 74 bytes

    def test_login_with_overlong_password_is_a_normal_401(self, client):
        register(client)

        response = client.post(LOGIN_URL, json={"email": "asha@example.com", "password": "a" * 100})

        assert response.status_code == 401
