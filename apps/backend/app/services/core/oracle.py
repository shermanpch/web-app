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
    CLARIFICATION_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "clarification_prompt.txt")
    # fmt:on

    def __init__(self):
        """Initialize the Oracle instance."""
        self.system_prompt = self._load_prompt(self.SYSTEM_PROMPT_PATH)
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
        Generate an initial I Ching reading based on the provided text and question.

        This method combines the I Ching text associated with the parent and child coordinates
        with the user's question to generate a complete reading through the LLM.

        Args:
            reading: IChingReadingRequest containing the user's question and input numbers
            text: IChingTextResponse containing the parent and child hexagram texts

        Returns:
            IChingReadingResponse: Complete reading response with prediction and original request data
        """
        parent_markdown = self._convert_dict_to_markdown(text.parent_json)
        child_markdown = self._convert_dict_to_markdown(text.child_json)

        system_prompt_with_text = self.system_prompt.format(
            parent_context_md=parent_markdown,
            child_context_md=child_markdown,
            language=reading.language,
        )

        try:
            logger.info(
                f"Sending initial reading request with model {settings.OPENAI_MODEL} for question: {reading.question[:50]}..."
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

            logger.info(f"Received structured prediction data")

            # Construct the final response object
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
            List of Markdown-formatted strings
        """
        lines = []
        prefix = "  " * indent_level  # Two spaces per indent level

        if isinstance(data, dict):
            for key, value in data.items():
                formatted_key = key.replace("_", " ").title()
                if isinstance(value, dict) or isinstance(value, list):
                    lines.append(f"{prefix}- **{formatted_key}:**")
                    lines.extend(
                        self._format_nested_dict_to_markdown(value, indent_level + 1)
                    )
                elif isinstance(value, str):
                    # For multiline strings, indent subsequent lines appropriately
                    str_lines = value.split("\n")
                    lines.append(f"{prefix}- **{formatted_key}:** {str_lines[0]}")
                    for i in range(1, len(str_lines)):
                        lines.append(
                            f"{prefix}  {str_lines[i]}"
                        )  # Indent continued lines
                elif value is None:
                    lines.append(f"{prefix}- **{formatted_key}:** N/A")
                else:
                    lines.append(f"{prefix}- **{formatted_key}:** {str(value)}")
        elif isinstance(data, list):
            for i, item in enumerate(data):
                lines.append(f"{prefix}- Item {i+1}:")
                lines.extend(
                    self._format_nested_dict_to_markdown(item, indent_level + 1)
                )
        elif isinstance(data, str):
            str_lines = data.split("\n")
            # If called with a string directly (e.g. from a list of strings), prefix it directly
            lines.append(f"{prefix}{str_lines[0]}")
            for i in range(1, len(str_lines)):
                lines.append(f"{prefix}  {str_lines[i]}")
        elif data is None:
            lines.append(f"{prefix}N/A")
        else:
            lines.append(f"{prefix}{str(data)}")

        return lines

    def _convert_dict_to_markdown(self, data_dict: Optional[Dict[str, Any]]) -> str:
        """
        Converts a dictionary to a well-formatted Markdown string.

        Args:
            data_dict: The dictionary to convert

        Returns:
            Markdown-formatted string representation of the dictionary
        """
        if not data_dict:
            return "No data provided for this section."

        markdown_sections = []
        for top_key, top_value in data_dict.items():
            formatted_top_key = top_key.replace("_", " ").title()
            markdown_sections.append(f"### {formatted_top_key}")

            if isinstance(top_value, dict):
                # Indent level is 0 since _format_nested_dict_to_markdown handles its own indentation
                markdown_sections.extend(
                    self._format_nested_dict_to_markdown(top_value, indent_level=0)
                )
            elif isinstance(top_value, str):
                str_lines = top_value.split("\n")
                # For a simple string value directly under an H3, just print it.
                for i, line_part in enumerate(str_lines):
                    if i == 0:
                        markdown_sections.append(line_part)
                    else:
                        markdown_sections.append(
                            f"  {line_part}"
                        )  # Basic indent for continued lines
            elif top_value is None:
                markdown_sections.append("N/A")
            else:  # For lists or other simple types directly under top_key
                markdown_sections.extend(
                    self._format_nested_dict_to_markdown(top_value, indent_level=0)
                )

            markdown_sections.append("")

        return "\n".join(markdown_sections).strip()
