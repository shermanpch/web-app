"""Configuration settings for the application."""

import os
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # Base settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    @property
    def cors_origins(self) -> list[str]:
        """Get the CORS origins based on environment."""
        origins = [self.FRONTEND_URL]
        print(f"CORS Origins Allowed: {origins}")
        return origins

    @property
    def cookie_domain(self) -> str | None:
        """Get the cookie domain based on the frontend URL."""
        parsed_url = urlparse(self.FRONTEND_URL)
        hostname = parsed_url.hostname
        if not hostname:
            return None

        # For localhost development
        if hostname == "localhost":
            return None  # Browser will automatically set cookie domain to localhost

        # Extract the base domain (remove www. if present)
        parts = hostname.split(".")
        if len(parts) >= 3 and parts[0] == "www":
            base_domain = ".".join(parts[1:])
        else:
            base_domain = hostname

        # For production with subdomains (e.g., deltao.ai and api.deltao.ai)
        # Add a dot prefix to allow sharing between subdomains
        return f".{base_domain}" if "." in base_domain else base_domain

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "")

    # Testing
    TEST_EMAIL: str = os.getenv("TEST_EMAIL", "test@example.com")

    # Settings
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
