import logging
import os
from typing import Any, Dict, List, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
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
    # fmt:off
    SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "system_prompt.txt")
    DEEP_DIVE_SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "deep_dive_system_prompt.txt")
    CLARIFICATION_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "clarification_prompt.txt")
    # fmt:on

    def __init__(self):
        """Initialize the Oracle instance."""
        self.system_prompt = self._load_prompt(self.SYSTEM_PROMPT_PATH)
        self.deep_dive_prompt = self._load_prompt(self.DEEP_DIVE_SYSTEM_PROMPT_PATH)
        self.clarification_prompt = self._load_prompt(self.CLARIFICATION_PROMPT_PATH)

        # Initialize LangChain ChatOpenAI model
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )

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
        Generate an I Ching reading based on the provided text and question.

        This method combines the I Ching text associated with the parent and child coordinates
        with the user's question to generate a complete reading through the LLM.
        It supports both basic and deep dive reading modes.

        Args:
            reading: IChingReadingRequest containing the user's question, input numbers, and mode
            text: IChingTextResponse containing the parent and child hexagram texts

        Returns:
            IChingReadingResponse: Complete reading response with prediction and original request data
        """
        parent_markdown = self._convert_dict_to_markdown(text.parent_json)
        child_markdown = self._convert_dict_to_markdown(text.child_json)

        prompt_format_args = {
            "parent_context_md": parent_markdown,
            "child_context_md": child_markdown,
            "language": reading.language,
        }

        # Select the appropriate system prompt based on the reading mode
        if reading.mode == "deep_dive" and reading.deep_dive_context:
            # Format deep dive context for inclusion in the prompt
            deep_dive_context_md = self._convert_dict_to_markdown(
                reading.deep_dive_context.model_dump(exclude_none=True)
            )
            system_prompt_template = self.deep_dive_prompt
            prompt_format_args["deep_dive_user_context_md"] = deep_dive_context_md
        else:
            # Use basic prompt for basic mode or if deep dive context is missing
            system_prompt_template = self.system_prompt

        system_prompt_with_text = system_prompt_template.format(**prompt_format_args)

        try:
            logger.info(
                f"Sending {reading.mode} reading request with model {settings.OPENAI_MODEL} for question: {reading.question[:50]}..."
            )

            # Create structured LLM with output parser
            structured_llm = self.llm.with_structured_output(IChingPrediction)

            # Create prompt template
            prompt = ChatPromptTemplate.from_messages(
                [("system", system_prompt_with_text), ("user", "{question}")]
            )

            # Create and invoke the chain
            chain = prompt | structured_llm
            prediction_data = await chain.ainvoke({"question": reading.question})

            logger.info(f"Received structured prediction data for {reading.mode} mode")

            # Construct the final response object
            final_response_data = {
                **prediction_data.model_dump(),
                "first_number": reading.first_number,
                "second_number": reading.second_number,
                "third_number": reading.third_number,
                "question": reading.question,
                "language": reading.language,
                "mode": reading.mode,
            }

            final_response = IChingReadingResponse(**final_response_data)
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
            # Convert the initial IChingPrediction object to a dictionary
            initial_reading_dict = request.prediction.model_dump()
            # Convert the dictionary to a markdown string
            initial_reading_md = self._convert_dict_to_markdown(initial_reading_dict)

            system_prompt_with_text = self.clarification_prompt.format(
                question=request.question,
                initial_reading=initial_reading_md,
                clarifying_question=request.clarifying_question,
                language=request.language,
            )

            logger.info(
                f"Sending clarification request (model: {settings.OPENAI_MODEL}, lang: {request.language}) for question: {request.clarifying_question[:50]}..."
            )

            # Create prompt template
            prompt = ChatPromptTemplate.from_messages(
                [("system", system_prompt_with_text), ("user", "{clarifying_question}")]
            )

            # Create and invoke the chain
            chain = prompt | self.llm
            response = await chain.ainvoke(
                {"clarifying_question": request.clarifying_question}
            )

            if not response or not hasattr(response, "content"):
                logger.warning(
                    "LLM returned invalid or empty response for clarification."
                )
                raise ValueError(
                    "LLM returned invalid or empty response for clarification"
                )

            content = response.content
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

    def _format_nested_dict_to_markdown(
        self, data: Any, indent_level: int = 0
    ) -> List[str]:
        """
        Recursive helper to format nested dictionaries and lists into Markdown strings.

        Args:
            data: The data to format (can be dict, list, str, or other primitives)
            indent_level: Current indentation level (0 for top level)

        Returns:
            List[str]: A list of formatted Markdown strings representing the data
        """
        lines = []
        indent = "  " * indent_level

        if isinstance(data, dict):
            for key, value in data.items():
                # Format the key as a header or label
                key_str = str(key).replace("_", " ").title()

                if isinstance(value, (dict, list)):
                    lines.append(f"{indent}**{key_str}**:")
                    lines.extend(
                        self._format_nested_dict_to_markdown(value, indent_level + 1)
                    )
                else:
                    if value is not None:
                        lines.append(f"{indent}**{key_str}**: {value}")

        elif isinstance(data, list):
            for item in data:
                if isinstance(item, (dict, list)):
                    lines.extend(
                        self._format_nested_dict_to_markdown(item, indent_level)
                    )
                    lines.append("")  # Add a blank line between list items
                else:
                    lines.append(f"{indent}- {item}")
        else:
            lines.append(f"{indent}{data}")

        return lines

    def _convert_dict_to_markdown(self, data_dict: Optional[Dict[str, Any]]) -> str:
        """
        Convert a dictionary to a Markdown formatted string.

        Args:
            data_dict: The dictionary to convert. Can be None.

        Returns:
            str: A Markdown formatted string representation of the dictionary
        """
        if not data_dict:
            return "No data available"

        lines = self._format_nested_dict_to_markdown(data_dict)
        return "\n".join(lines)
