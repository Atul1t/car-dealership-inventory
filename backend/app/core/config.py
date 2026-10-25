"""Application settings, loaded from environment variables (or a local .env file)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed configuration. Every field can be overridden by an env var of the same name."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Car Dealership Inventory API"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/dealership"

    jwt_secret_key: str = "dev-only-secret-change-me-in-production-please"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # bcrypt work factor. Tests lower it to keep the suite fast.
    bcrypt_rounds: int = 12

    # Comma-separated list of origins allowed to call the API from a browser.
    cors_origins: str = "http://localhost:5173"

    admin_email: str = "admin@dealership.com"
    admin_password: str = "Admin@12345"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so env parsing happens once per process."""
    return Settings()
