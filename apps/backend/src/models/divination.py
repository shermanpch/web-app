"""Divination models for the application."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserQuota(BaseModel):
    """User quota model."""

    user_id: str
    membership_type: str
    remaining_queries: int
    created_at: datetime
    updated_at: datetime
