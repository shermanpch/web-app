"""User quota models for the application."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserQuota(BaseModel):
    """User quota model."""

    user_id: UUID
    membership_type: str
    remaining_queries: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
