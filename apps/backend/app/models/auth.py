"""Authentication models for the application."""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user model with common fields."""

    email: Optional[EmailStr] = None


class UserData(UserBase):
    """User data model returned to clients."""

    id: str
    last_sign_in_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class TokenData(BaseModel):
    """Token data extracted from JWT."""

    user_id: str = Field(..., alias="sub")
    email: Optional[EmailStr] = None
    exp: Optional[int] = None  # Expiration timestamp

    def is_expired(self) -> bool:
        """Check if token is expired."""
        if self.exp is None:
            return False
        now = datetime.now(timezone.utc).timestamp()
        return now > self.exp


class UserLogin(BaseModel):
    """User login request model."""

    email: EmailStr
    password: str


class UserSignup(UserLogin):
    """User signup request model."""

    pass


class PasswordReset(BaseModel):
    """Password reset request model."""

    email: EmailStr


class PasswordChange(BaseModel):
    """Password change request model."""

    password: str


class AuthResponse(BaseModel):
    """Base authentication response model."""

    success: bool
    message: Optional[str] = None


class SessionInfo(BaseModel):
    """Session information returned after authentication."""

    access_token: str
    refresh_token: str
    expires_in: int


class AuthenticatedSession(BaseModel):
    """Authenticated session data with tokens."""

    access_token: str
    refresh_token: str


class UserSession(BaseModel):
    """User session data returned to frontend."""

    user: UserData


class UserSessionResponse(BaseModel):
    """Response model for user session data."""

    success: bool = True
    data: Optional[UserSession] = None
    message: Optional[str] = None
