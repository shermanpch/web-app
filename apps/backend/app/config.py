"""Configuration settings for the application."""

import os
from typing import List

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Base settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    # Define the port netlify dev runs on (from your netlify.toml [dev] block)
    NETLIFY_DEV_PORT: int = int(os.getenv("NETLIFY_DEV_PORT", "8888"))

    @property
    def cors_origins(self) -> List[str]:
        """Get the CORS origins based on environment."""
        # Start with the primary frontend URL defined in env vars
        origins = [self.FRONTEND_URL]

        # Add development-specific origins
        if self.ENVIRONMENT == "development":
            # Add the direct Next.js dev port if not already the FRONTEND_URL
            direct_frontend_dev_url = "http://localhost:3000"
            if direct_frontend_dev_url not in origins:
                origins.append(direct_frontend_dev_url)

            # Add the backend's own origin (useful for certain tools/debugging)
            # Use self.HOST if needed, but localhost is typical for dev
            backend_url = f"http://localhost:{self.PORT}"
            if backend_url not in origins:
                origins.append(backend_url)

            # *** THIS IS THE KEY ADDITION ***
            # Add the Netlify Dev proxy origin
            netlify_dev_url = f"http://localhost:{self.NETLIFY_DEV_PORT}"
            if netlify_dev_url not in origins:
                origins.append(netlify_dev_url)

        # Remove potential duplicates if URLs were the same
        unique_origins = list(set(origins))
        print(f"CORS Origins Allowed: {unique_origins}")  # Optional: for debugging
        return unique_origins

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")

    # Testing
    TEST_EMAIL: str = os.getenv("TEST_EMAIL", "test@example.com")

    # Settings
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
