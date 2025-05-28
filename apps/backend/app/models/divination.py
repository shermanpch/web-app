"""Divination models for the application."""

from typing import Any

from pydantic import BaseModel, Field

# fmt:off

# --- Basic component models ---

class LineChange(BaseModel):
    """Represents a specific changing line in the hexagram."""

    line: str = Field(description="The specific changing line, e.g., '初六'.")
    pinyin: str = Field(description="Pinyin of the changing line, e.g., 'chū liù'.")
    interpretation: str = Field(description="Interpretation of this changing line.")


class HexagramResult(BaseModel):
    """Represents the resulting hexagram interpretation."""

    name: str = Field(description="Name of the resulting hexagram after changes in Chinese, e.g., '火山旅'.")
    pinyin: str = Field(description="Pinyin of the resulting hexagram, e.g., 'huǒ shān lǚ'.")
    interpretation: str = Field(description="Interpretation of the resulting hexagram.")


class DeepDiveContext(BaseModel):
    """Additional context for Deep Dive I Ching readings."""

    area_of_life: str | None = Field(None, description="User's stated area of life (e.g., Career, Relationships). This helps focus the LLM's interpretation.")
    background_situation: str | None = Field(None, description="User's brief description of the situation or context surrounding their question. Provides specific details for the LLM.")
    current_feelings: list[str] | None = Field(None, description="User's current feelings or emotional state related to the question (e.g., ['Anxious', 'Hopeful']). Helps LLM tailor the tone.")
    desired_outcome: str | None = Field(None, description="What the user hopes to gain from the reading (e.g., Clarity, Reassurance). Guides the LLM in framing advice.")


class IChingDeepDivePredictionDetails(BaseModel):
    """Detailed prediction data for Deep Dive readings."""

    expanded_primary_interpretation: str = Field(description="A more in-depth analysis of the primary hexagram, specifically relating its symbolism and traditional meanings to the user's provided DeepDiveContext (area_of_life, background_situation, etc.). Should be more extensive than the basic interpretation.")
    contextual_changing_line_interpretation: str = Field(description="A deeper interpretation of the changing line identified in the basic prediction (from IChingPrediction.line_change), specifically explaining its significance in relation to the user's DeepDiveContext.")
    expanded_transformed_interpretation: str = Field(description="A richer interpretation of the hexagram that results from the line change(s) (from IChingPrediction.result), considering how it offers a path forward or a new perspective in relation to the user's DeepDiveContext.")
    thematic_connections: list[str] = Field(description="A list of 2-3 key themes or overarching lessons synthesized from the entire reading (primary hexagram, changing line, transformed hexagram, and user context).")
    actionable_insights_and_reflections: str = Field(description="More specific, tailored advice and actionable steps than the basic reading's advice. Should also include reflection prompts or questions for the user to consider, based on their DeepDiveContext and the reading's insights.")
    potential_pitfalls: str | None = Field(None, description="Potential challenges, obstacles, or areas of caution highlighted by the reading, relevant to the user's situation.")
    key_strengths: str | None = Field(None, description="Identified strengths, positive aspects, or resources (internal/external) that the user can leverage, as indicated by the reading and their context.")


class IChingPrediction(BaseModel):
    """Structured I Ching prediction model."""

    hexagram_name: str = Field(description="The hexagram's name in Chinese, e.g., '小过卦'.")
    pinyin: str = Field(description="Pinyin of the hexagram, e.g., 'xiǎo guò guà'.")
    summary: str = Field(description="A brief, one-sentence summary of the hexagram's central theme.")
    interpretation: str = Field(description="A detailed interpretation of the hexagram (exactly five sentences) related to the user's question, based on the Parent Context.")
    line_change: LineChange = Field(description="Details of the changing line based on the Child Context.")
    result: HexagramResult = Field(description="The resulting hexagram after line changes, based on the Child Context.")
    advice: str = Field(description="Clear, specific, and practical recommendation directly answering the user's question.")
    deep_dive_details: IChingDeepDivePredictionDetails | None = Field(None, description="Contains all the detailed analyses specific to a Deep Dive reading. Will be null for basic readings.")


# --- Coordinate calculation models ---

class IChingCoordinatesRequest(BaseModel):
    """I Ching coordinates request model."""

    first_number: int
    second_number: int
    third_number: int


class IChingCoordinatesResponse(BaseModel):
    """I Ching coordinates response model."""

    parent_coord: str
    child_coord: str


# --- Text retrieval models ---

class IChingTextRequest(BaseModel):
    """I Ching text request model."""

    parent_coord: str
    child_coord: str


class IChingTextResponse(BaseModel):
    """I Ching text response model."""

    parent_coord: str
    child_coord: str
    parent_json: dict[str, Any] | None = None
    child_json: dict[str, Any] | None = None


# --- Reading generation models ---

class IChingReadingRequest(BaseModel):
    """I Ching reading request model."""

    question: str
    mode: str = "basic"
    language: str = "English"
    first_number: int
    second_number: int
    third_number: int
    deep_dive_context: DeepDiveContext | None = Field(None, description="Additional context provided by the user for deep dive mode.")


class IChingReadingResponse(IChingPrediction):
    """I Ching reading response model."""

    question: str
    mode: str
    language: str
    first_number: int
    second_number: int
    third_number: int


# --- Reading storage models ---

class IChingSaveReadingRequest(BaseModel):
    """Request model for saving I Ching reading to database."""

    user_id: str
    question: str
    mode: str = "basic"
    language: str = "English"
    first_number: int
    second_number: int
    third_number: int
    prediction: IChingPrediction | None = None
    clarifying_question: str | None = None
    clarifying_answer: str | None = None


class IChingSaveReadingResponse(BaseModel):
    """Response model for saved I Ching reading."""

    id: str  # UUID but returned as string
    user_id: str
    created_at: str
    success: bool
    message: str


# --- Reading update models ---

class IChingUpdateReadingRequest(BaseModel):
    """Request model for updating I Ching reading."""

    id: str
    user_id: str
    question: str
    mode: str = "basic"
    language: str = "English"
    first_number: int
    second_number: int
    third_number: int
    prediction: IChingPrediction
    clarifying_question: str
    clarifying_answer: str | None = None


class IChingUpdateReadingResponse(BaseModel):
    """Response model for updating I Ching reading."""

    id: str
    user_id: str
    question: str
    mode: str = "basic"
    language: str = "English"
    first_number: int
    second_number: int
    third_number: int
    prediction: IChingPrediction
    clarifying_question: str
    clarifying_answer: str

# fmt:on
