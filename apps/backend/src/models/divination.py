"""Divination models for the application."""

from typing import Optional

from pydantic import BaseModel


class IChingTextRequest(BaseModel):
    """I Ching text request model."""

    parent_coord: str
    child_coord: str
    access_token: Optional[str] = None


class IChingTextResponse(BaseModel):
    """I Ching text response model."""

    parent_coord: str
    child_coord: str
    parent_text: Optional[str] = None
    child_text: Optional[str] = None
