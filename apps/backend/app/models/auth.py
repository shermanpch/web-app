"""Authentication models for the application."""

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user model with common fields."""

    email: EmailStr | None = None


class UserData(UserBase):
    """User data model returned to clients."""

    id: str
    last_sign_in_at: datetime | None = None
    created_at: datetime | None = None
    email_confirmed_at: datetime | None = None


class UserLogin(BaseModel):
    """User login request model."""

    email: EmailStr
    password: str
    remember_me: bool | None = False


class UserSignup(UserLogin):
    """User signup request model."""

    pass


class PasswordReset(BaseModel):
    """Password reset request model."""

    email: EmailStr


class PasswordChange(BaseModel):
    """Password change request model."""

    password: str


class EmailRequest(BaseModel):
    """Email request model for resend confirmation."""

    email: EmailStr


class AuthResponse(BaseModel):
    """Base authentication response model."""

    success: bool
    message: str | None = None


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
    data: UserSession | None = None
    message: str | None = None
