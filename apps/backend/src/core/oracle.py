class Oracle:
    def __init__(self):
        """Initialize the Oracle instance."""
        self.first = None
        self.second = None
        self.third = None
        self.parent_coord = None
        self.child_coord = None
        self.parent_text = None
        self.child_text = None
        self.hexagram_image = None

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

    def convert_to_cord(self):
        """
        Convert the input values to coordinate values using modulo arithmetic.

        The conversion rules are:
            - first_cord = first % 8
            - second_cord = second % 8
            - third_cord = third % 6

        These computed coordinates are used to construct the directory paths for retrieving files.

        Returns:
            tuple: (parent_coord, child_coord) where parent_coord is a tuple (x, y) and child_coord is an integer

        Raises:
            ValueError: If input values have not been set
        """
        if any(v is None for v in [self.first, self.second, self.third]):
            raise ValueError(
                "Input values must be set before converting to coordinates"
            )

        self.parent_coord = (self.first % 8, self.second % 8)
        self.child_coord = self.third % 6

        return self.parent_coord, self.child_coord

    async def fetch_texts(self, api_client):
        """
        Fetch the I Ching text based on parent and child coordinates.

        Args:
            api_client: The API client to use for fetching text

        Returns:
            tuple: (parent_text, child_text)

        Raises:
            ValueError: If coordinates have not been computed
            Exception: For any API errors
        """
        if self.parent_coord is None or self.child_coord is None:
            # Convert coordinates if not already done
            self.convert_to_cord()

        try:
            from ..models.divination import IChingTextRequest

            # Format coordinates as strings for the API request
            parent_coord_str = f"{self.parent_coord[0]}-{self.parent_coord[1]}"
            child_coord_str = str(self.child_coord)

            # Create request object without tokens - they're in the API client
            request = IChingTextRequest(
                parent_coord=parent_coord_str, child_coord=child_coord_str
            )

            # Fetch text from API
            response = await api_client.get_iching_text(request)

            self.parent_text = response.parent_text
            self.child_text = response.child_text

            return self.parent_text, self.child_text

        except Exception as e:
            raise Exception(f"Error fetching I Ching text: {str(e)}")

    async def fetch_image(self, api_client):
        """
        Fetch the I Ching hexagram image based on parent and child coordinates.

        Args:
            api_client: The API client to use for fetching the image

        Returns:
            IChingImage: Object containing coordinates and image URL

        Raises:
            ValueError: If coordinates have not been computed
            Exception: For any API errors
        """
        if self.parent_coord is None or self.child_coord is None:
            # Convert coordinates if not already done
            self.convert_to_cord()

        try:
            # Format coordinates as strings for the API request
            # For image path, use hyphen format (0-1)
            parent_coord_str = f"{self.parent_coord[0]}-{self.parent_coord[1]}"
            child_coord_str = str(self.child_coord)

            # Fetch image URL from API
            self.hexagram_image = await api_client.get_iching_image(
                parent_coord_str, child_coord_str
            )

            return self.hexagram_image

        except Exception as e:
            raise Exception(f"Error fetching I Ching image: {str(e)}")

    async def generate_reading(
        self,
        api_client,
        question,
        user_id=None,
        language="English",
        include_image=True,
    ):
        """
        Generate a complete I Ching reading based on the input numbers and question.

        Args:
            api_client: The API client to use for fetching text
            question (str): The user's question
            user_id (UUID, optional): The user ID to associate with this reading
            language (str): The language for the reading
            include_image (bool): Whether to include the hexagram image in the reading

        Returns:
            dict: A complete reading with prediction

        Raises:
            Exception: For any errors during the reading generation
        """
        try:
            # Ensure coordinates are computed
            self.convert_to_cord()

            # Fetch the texts
            await self.fetch_texts(api_client)

            # Fetch the hexagram image if requested
            image_response = None
            if include_image:
                image_response = await self.fetch_image(api_client)

            # Construct the prediction data
            prediction = {
                "parent_coord": self.parent_coord,
                "child_coord": self.child_coord,
                "parent_text": self.parent_text,
                "child_text": self.child_text,
                "hexagram": f"{self.parent_coord[0]},{self.parent_coord[1]}/{self.child_coord}",
            }

            # Add image to prediction if available
            if image_response:
                prediction["image_url"] = image_response.image_url

            # Optionally store the reading in the database
            if user_id:
                from ..models.readings import UserReadingCreate

                reading = UserReadingCreate(
                    user_id=user_id,
                    question=question,
                    first_number=self.first,
                    second_number=self.second,
                    third_number=self.third,
                    language=language,
                )

                # Store the reading using the API client
                await api_client.create_reading(reading, prediction)

            return {
                "question": question,
                "coordinates": {"parent": self.parent_coord, "child": self.child_coord},
                "prediction": prediction,
                "language": language,
            }

        except Exception as e:
            raise Exception(f"Error generating reading: {str(e)}")
