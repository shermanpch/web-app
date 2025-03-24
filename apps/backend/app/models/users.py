"""User readings models for the application."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class UserQuotaRequest(BaseModel):
    """User quota request model."""

    user_id: UUID
    access_token: str
    refresh_token: str


class UserQuotaResponse(BaseModel):
    """User quota response model."""

    user_id: UUID
    membership_type: str
    remaining_queries: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserReading(BaseModel):
    """User reading model representing entries in the user_readings table."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: Optional[Dict[str, Any]] = None
    clarifying_question: Optional[str] = None
    clarifying_answer: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class UserReadingCreate(BaseModel):
    """Model for creating a new user reading."""

    user_id: UUID
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: Optional[Dict[str, Any]] = None
    clarifying_question: Optional[str] = None
    clarifying_answer: Optional[str] = None
