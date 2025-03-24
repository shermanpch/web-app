import os

from openai import OpenAI

from ...config import settings
from ...models.divination import (
    IChingImageResponse,
    IChingReadingRequest,
    IChingReadingResponse,
    IChingTextResponse,
)


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

    def get_initial_reading(
        self,
        reading: IChingReadingRequest,
        text: IChingTextResponse,
        image: IChingImageResponse,
    ) -> IChingReadingResponse:

        system_prompt_with_text = self.system_prompt.format(
            parent_text=text.parent_text,
            child_text=text.child_text,
            language=reading.language,
        )

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        response = client.beta.chat.completions.parse(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt_with_text},
                {"role": "user", "content": reading.question},
            ],
            response_format=IChingReadingResponse,
        )

        parsed_response = response.choices[0].message.parsed
        parsed_response.image_path = image.image_url
        parsed_response.first_number = reading.first_number
        parsed_response.second_number = reading.second_number
        parsed_response.third_number = reading.third_number
        parsed_response.question = reading.question
        return parsed_response

    def _load_prompt(self, prompt_path):
        """
        Load prompt from prompt file.
        """
        with open(prompt_path, "r") as file:
            return file.read()
