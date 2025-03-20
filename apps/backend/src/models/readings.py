"""User readings models for the application."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


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


class UserReadingUpdate(BaseModel):
    """Model for updating an existing user reading."""

    prediction: Optional[Dict[str, Any]] = None
    clarifying_question: Optional[str] = None
    clarifying_answer: Optional[str] = None
