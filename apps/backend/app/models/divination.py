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


class IChingPrediction(BaseModel):
    """Structured I Ching prediction model."""

    hexagram_name: str
    summary: str
    interpretation: str
    line_change: LineChange
    result: HexagramResult
    advice: str
    image_path: Optional[str] = None


class IChingReadingRequest(BaseModel):
    """I Ching reading request model."""

    first_number: int
    second_number: int
    third_number: int
    question: str
    language: str = "English"
    access_token: str
    refresh_token: str


class IChingReadingResponse(IChingPrediction):
    """I Ching reading response model."""

    first_number: int
    second_number: int
    third_number: int
    question: str
    language: str


class IChingSaveReadingRequest(BaseModel):
    """Request model for saving I Ching reading to database."""

    user_id: str  # UUID but passed as string
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: Optional[IChingPrediction] = None
    clarifying_question: Optional[str] = None
    clarifying_answer: Optional[str] = None
    access_token: str
    refresh_token: str


class IChingSaveReadingResponse(BaseModel):
    """Response model for saved I Ching reading."""

    id: str  # UUID but returned as string
    user_id: str
    created_at: str
    success: bool
    message: str


class IChingUpdateReadingRequest(BaseModel):
    """Request model for updating I Ching reading."""

    id: str  # UUID but passed as string
    user_id: str  # UUID but passed as string
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: IChingPrediction
    clarifying_question: str
    clarifying_answer: Optional[str] = None
    access_token: str
    refresh_token: str


class IChingUpdateReadingResponse(BaseModel):
    """Response model for updating I Ching reading."""

    id: str  # UUID but passed as string
    user_id: str  # UUID but passed as string
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: IChingPrediction
    clarifying_question: str
    clarifying_answer: str
