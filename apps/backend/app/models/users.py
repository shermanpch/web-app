"""User readings models for the application."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserQuotaRequest(BaseModel):
    """User quota request model."""

    user_id: UUID


class UpdateUserQuotaRequest(BaseModel):
    """User quota update request model."""

    user_id: UUID


class UpdateUserQuotaResponse(BaseModel):
    """User quota update response model."""

    user_id: UUID
    membership_type: str
    remaining_queries: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserQuotaResponse(BaseModel):
    """User quota response model."""

    user_id: UUID
    membership_type: str
    remaining_queries: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserReadingResponse(BaseModel):
    """Model for returning a single user reading via API."""

    id: UUID
    user_id: UUID
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str
    prediction: Optional[Dict[str, Any]] = None
    clarifying_question: Optional[str] = None
    clarifying_answer: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
