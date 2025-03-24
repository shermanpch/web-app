"""Divination models for the application."""

from typing import Optional

from pydantic import BaseModel


class IChingTextRequest(BaseModel):
    """I Ching text request model."""

    parent_coord: str
    child_coord: str
    access_token: str
    refresh_token: str


class IChingTextResponse(BaseModel):
    """I Ching text response model."""

    parent_coord: str
    child_coord: str
    parent_text: Optional[str] = None
    child_text: Optional[str] = None


class IChingImageRequest(BaseModel):
    """I Ching image request model."""

    parent_coord: str
    child_coord: str
    access_token: str
    refresh_token: str


class IChingImageResponse(BaseModel):
    """I Ching image response model."""

    parent_coord: str
    child_coord: str
    image_url: str
