"""Authentication models for the application."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user model with common fields."""

    email: Optional[EmailStr] = None


class UserData(UserBase):
    """User data model returned to clients."""

    id: str
    last_sign_in_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


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
