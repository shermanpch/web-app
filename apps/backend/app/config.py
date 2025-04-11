"""Configuration settings for the application."""

import os
from typing import List
from urllib.parse import urlparse

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Base settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Define the port netlify dev runs on (from your netlify.toml [dev] block)
    NETLIFY_DEV_PORT: int = int(os.getenv("NETLIFY_DEV_PORT", "8888"))

    @property
    def cors_origins(self) -> List[str]:
        """Get the CORS origins based on environment."""
        origins = [
            self.FRONTEND_URL,
            f"https://localhost:{self.NETLIFY_DEV_PORT}",
        ]
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

        # For production with subdomains (e.g., deltao.ai and api.deltao.ai)
        # Add a dot prefix to allow sharing between subdomains
        return f".{hostname}" if "." in hostname else hostname

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
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
