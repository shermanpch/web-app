import logging
import os

from openai import AsyncOpenAI
from pydantic import ValidationError

from ...config import settings
from ...models.divination import (
    IChingPrediction,
    IChingReadingRequest,
    IChingReadingResponse,
    IChingTextResponse,
    IChingUpdateReadingRequest,
    IChingUpdateReadingResponse,
)

# Set up logger
logger = logging.getLogger(__name__)


class Oracle:
    SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "system_prompt.txt")
    CLARIFICATION_PROMPT_PATH = os.path.join(
        os.path.dirname(__file__), "clarification_prompt.txt"
    )

    def __init__(self):
        """Initialize the Oracle instance."""
        self.system_prompt = self._load_prompt(self.SYSTEM_PROMPT_PATH)
        self.clarification_prompt = self._load_prompt(self.CLARIFICATION_PROMPT_PATH)

        self.first = None
        self.second = None
        self.third = None
        self.parent_coord = None
        self.child_coord = None

    def input(self, first, second, third):
        """
        Set the input values that determine the coordinate-based file paths.

        These input values will be used to compute:
            - first_cord: first % 8
            - second_cord: second % 8
            - third_cord: third % 6

        Args:
            first (int): The first integer value.
            second (int): The second integer value.
            third (int): The third integer value.

        Returns:
            Oracle: Returns self for method chaining
        """
        self.first = first
        self.second = second
        self.third = third
        return self

    def convert_to_coordinates(self):
        """
        Convert the input values to coordinate string values using modulo arithmetic.

        The conversion rules are:
            - first_cord = first % 8
            - second_cord = second % 8
            - third_cord = third % 6

        These computed coordinates are used to construct the directory paths for retrieving files.

        Returns:
            tuple: (parent_coord, child_coord) where parent_coord is a string formatted as "first_cord-second_cord"
                  (e.g., "2-1") and child_coord is a string representation of third_cord (e.g., "1")

        Raises:
            ValueError: If input values have not been set
        """
        if any(v is None for v in [self.first, self.second, self.third]):
            raise ValueError(
                "Input values must be set before converting to coordinates"
            )

        self.parent_coord = f"{self.first % 8}-{self.second % 8}"
        self.child_coord = f"{self.third % 6}"
        return self.parent_coord, self.child_coord

    async def get_initial_reading(
        self,
        reading: IChingReadingRequest,
        text: IChingTextResponse,
    ) -> IChingReadingResponse:
        """
        Generate an initial I Ching reading based on the provided text and question.

        This method combines the I Ching text associated with the parent and child coordinates
        with the user's question to generate a complete reading through the LLM.

        Args:
            reading: IChingReadingRequest containing the user's question and input numbers
            text: IChingTextResponse containing the parent and child hexagram texts

        Returns:
            IChingReadingResponse: Complete reading response with prediction and original request data
        """

        system_prompt_with_text = self.system_prompt.format(
            parent_text=text.parent_text,
            child_text=text.child_text,
            language=reading.language,
        )

        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENAI_API_KEY,
        )

        try:
            logger.info(
                f"Sending initial reading request with model {settings.OPENAI_MODEL} for question: {reading.question[:50]}..."
            )

            raw_response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt_with_text},
                    {"role": "user", "content": reading.question},
                ],
            )

            raw_content = raw_response.choices[0].message.content
            logger.info(f"Received clarification response: {raw_content[:100]}...")

            cleaned_content = raw_content.strip()
            if cleaned_content.startswith("```") and cleaned_content.endswith("```"):
                cleaned_content = cleaned_content[3:-3].strip()
                if cleaned_content.lower().startswith("json"):
                    cleaned_content = cleaned_content[4:].strip()

            try:
                prediction_data = IChingPrediction.model_validate_json(cleaned_content)
            except (ValidationError, Exception) as parse_error:
                logger.error(
                    f"Failed to parse cleaned LLM response into IChingPrediction: {parse_error}"
                )
                raise ValueError(
                    f"Failed to parse LLM response JSON: {parse_error}"
                ) from parse_error

            final_response = IChingReadingResponse(
                **prediction_data.model_dump(),
                first_number=reading.first_number,
                second_number=reading.second_number,
                third_number=reading.third_number,
                question=reading.question,
                language=reading.language,
            )

            return final_response

        except Exception as e:
            logger.error(f"Error in get_initial_reading: {str(e)}")
            raise

    async def get_clarifying_reading(
        self, request: IChingUpdateReadingRequest
    ) -> IChingUpdateReadingResponse:
        """
        Generate a clarifying answer using the LLM.

        Args:
            request: Request containing original reading and clarifying question.

        Returns:
            Updated response object with the clarifying answer.

        Raises:
            ValueError: If LLM response is empty or invalid.
            RuntimeError: For unexpected errors during API call or processing.
        """
        try:
            system_prompt_with_text = self.clarification_prompt.format(
                question=request.question,
                initial_reading=request.prediction.model_dump_json(),
                clarifying_question=request.clarifying_question,
                language=request.language,
            )

            client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.OPENAI_API_KEY,
            )

            logger.info(
                f"Sending clarification request (model: {settings.OPENAI_MODEL}, lang: {request.language}) for question: {request.clarifying_question[:50]}..."
            )

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt_with_text},
                    {"role": "user", "content": request.clarifying_question},
                ],
            )

            if (
                not response.choices
                or not response.choices[0].message
                or not response.choices[0].message.content
            ):
                logger.warning(
                    "LLM returned invalid or empty response for clarification."
                )
                raise ValueError(
                    "LLM returned invalid or empty response for clarification"
                )

            content = response.choices[0].message.content
            logger.info(f"Received clarification response: {content[:100]}...")

            # Construct the final response object
            updated_data = request.model_dump()
            updated_data["clarifying_answer"] = content
            return IChingUpdateReadingResponse(**updated_data)

        except Exception as e:
            error_message = (
                f"Error in get_clarifying_reading: {type(e).__name__}: {str(e)}"
            )
            logger.error(error_message)
            if isinstance(e, ValueError):
                raise
            else:
                raise RuntimeError(f"Failed to generate clarification: {e}") from e

    def _load_prompt(self, prompt_path):
        """Load prompt from a file."""
        try:
            with open(prompt_path, "r", encoding="utf-8") as file:
                return file.read()
        except FileNotFoundError:
            logger.exception(f"CRITICAL: Prompt file not found at {prompt_path}")
            raise
        except Exception as e:
            logger.exception(f"CRITICAL: Error loading prompt file {prompt_path}: {e}")
            raise
