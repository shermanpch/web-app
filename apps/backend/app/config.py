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

    @property
    def cors_origins(self) -> List[str]:
        """Get the CORS origins based on environment."""
        origins = [self.FRONTEND_URL]

        # Add localhost for development
        if self.ENVIRONMENT == "development":
            if "localhost" not in self.FRONTEND_URL:
                origins.append("http://localhost:3000")
            origins.append("http://localhost:8000")

        return origins

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
