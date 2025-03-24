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


class IChingCoordinatesRequest(BaseModel):
    """I Ching coordinates request model."""

    first_number: int
    second_number: int
    third_number: int


class IChingCoordinatesResponse(BaseModel):
    """I Ching coordinates response model."""

    parent_coord: str
    child_coord: str


class HexagramResult(BaseModel):
    """Represents the resulting hexagram interpretation."""

    name: str
    interpretation: str


class LineChange(BaseModel):
    """Represents a specific changing line in the hexagram."""

    line: str
    interpretation: str


class IChingReadingRequest(BaseModel):
    """I Ching reading request model."""

    first_number: int
    second_number: int
    third_number: int
    question: str
    language: str
    access_token: str
    refresh_token: str


class IChingReadingResponse(BaseModel):
    """I Ching reading response model."""

    first_number: Optional[int] = None
    second_number: Optional[int] = None
    third_number: Optional[int] = None
    question: Optional[str] = None
    language: Optional[str] = None
    hexagram_name: str
    summary: str
    interpretation: str
    line_change: LineChange
    result: HexagramResult
    advice: str
    image_path: Optional[str] = None
