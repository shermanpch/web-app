import os
from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Base settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Frontend local dev
        "http://localhost:8000",  # Backend local dev
    ]

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
