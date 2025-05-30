"""User readings and profile models for the application."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserProfileResponse(BaseModel):
    """Model for user profile data from the profiles table."""

    id: UUID
    membership_tier_id: int
    membership_tier_name: str  # Joined from membership_tiers table
    premium_expiration: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserQuotaStatusResponse(BaseModel):
    """Model for calculated quota status for a specific feature."""

    feature_id: int
    feature_name: str
    limit: int | None = None  # NULL means unlimited
    used: int
    remaining: int | None = None  # NULL if limit is NULL (unlimited)
    resets_at: datetime  # Start of next week

    model_config = ConfigDict(from_attributes=True)


class UserProfileStatusResponse(BaseModel):
    """Combined response with profile and quota status."""

    profile: UserProfileResponse
    quotas: list[UserQuotaStatusResponse]

    model_config = ConfigDict(from_attributes=True)


class UserReadingResponse(BaseModel):
    """Model for returning a single user reading via API."""

    id: UUID
    user_id: UUID
    question: str
    mode: str
    language: str
    first_number: int
    second_number: int
    third_number: int
    prediction: dict | None = None
    clarifying_question: str | None = None
    clarifying_answer: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeleteReadingResponse(BaseModel):
    """Response model for deleted reading."""

    success: bool
    reading_id: UUID
    user_id: UUID
    message: str


class UserReadingsPaginatedResponse(BaseModel):
    """Paginated response model for user readings."""

    items: list[UserReadingResponse]
    total_items: int
    total_pages: int
    current_page: int
    page_size: int

    model_config = ConfigDict(from_attributes=True)
