"""Divination models for the application."""

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

# fmt:off

class IChingTextRequest(BaseModel):
    """I Ching text request model."""

    parent_coord: str
    child_coord: str


class IChingTextResponse(BaseModel):
    """I Ching text response model."""

    parent_coord: str
    child_coord: str
    parent_json: Optional[Dict[str, Any]] = None
    child_json: Optional[Dict[str, Any]] = None


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

    name: str = Field(description="Name of the resulting hexagram after changes in Chinese, e.g., '火山旅'.")
    pinyin: str = Field(description="Pinyin of the resulting hexagram, e.g., 'huǒ shān lǚ'.")
    interpretation: str = Field(description="Interpretation of the resulting hexagram.")


class LineChange(BaseModel):
    """Represents a specific changing line in the hexagram."""

    line: str = Field(description="The specific changing line, e.g., '初六'.")
    pinyin: str = Field(description="Pinyin of the changing line, e.g., 'chū liù'.")
    interpretation: str = Field(description="Interpretation of this changing line.")


class IChingPrediction(BaseModel):
    """Structured I Ching prediction model."""

    hexagram_name: str = Field(description="The hexagram's name in Chinese, e.g., '小过卦'.")
    pinyin: str = Field(description="Pinyin of the hexagram, e.g., 'xiǎo guò guà'.")
    summary: str = Field(description="A brief, one-sentence summary of the hexagram's central theme.")
    interpretation: str = Field(description="A detailed interpretation of the hexagram (exactly five sentences) related to the user's question, based on the Parent Context.")
    line_change: LineChange = Field(description="Details of the changing line based on the Child Context.")
    result: HexagramResult = Field(description="The resulting hexagram after line changes, based on the Child Context.")
    advice: str = Field(description="Clear, specific, and practical recommendation directly answering the user's question.")


class IChingReadingRequest(BaseModel):
    """I Ching reading request model."""

    first_number: int
    second_number: int
    third_number: int
    question: str
    language: str = "English"


class IChingReadingResponse(IChingPrediction):
    """I Ching reading response model."""

    first_number: int
    second_number: int
    third_number: int
    question: str
    language: str


class IChingSaveReadingRequest(BaseModel):
    """Request model for saving I Ching reading to database."""

    user_id: str
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: Optional[IChingPrediction] = None
    clarifying_question: Optional[str] = None
    clarifying_answer: Optional[str] = None


class IChingSaveReadingResponse(BaseModel):
    """Response model for saved I Ching reading."""

    id: str  # UUID but returned as string
    user_id: str
    created_at: str
    success: bool
    message: str


class IChingUpdateReadingRequest(BaseModel):
    """Request model for updating I Ching reading."""

    id: str
    user_id: str
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: IChingPrediction
    clarifying_question: str
    clarifying_answer: Optional[str] = None


class IChingUpdateReadingResponse(BaseModel):
    """Response model for updating I Ching reading."""

    id: str
    user_id: str
    question: str
    first_number: int
    second_number: int
    third_number: int
    language: str = "English"
    prediction: IChingPrediction
    clarifying_question: str
    clarifying_answer: str

# fmt:on
