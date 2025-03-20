"""Authentication models for the application."""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel


class UserData(BaseModel):
    """User data model."""

    id: str
    email: Optional[str] = None


class TokenPayload(BaseModel):
    """Token payload model."""

    sub: Optional[str] = None  # User ID
    email: Optional[str] = None
    exp: Optional[int] = None  # Expiration timestamp
    iat: Optional[int] = None  # Issued at timestamp

    def is_token_expired(self) -> bool:
        """Check if token is expired."""
        if self.exp is None:
            return False

        # Get current timestamp
        now = datetime.now(timezone.utc).timestamp()
        return now > self.exp


class UserLogin(BaseModel):
    """User login request model."""

    email: str
    password: str


class UserSignup(BaseModel):
    """User signup request model."""

    email: str
    password: str


class PasswordReset(BaseModel):
    """Password reset request model."""

    email: str


class PasswordChange(BaseModel):
    """Password change request model."""

    password: str
    access_token: str
    refresh_token: str
