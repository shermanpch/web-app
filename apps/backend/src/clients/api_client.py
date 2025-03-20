"""API client for interacting with the I Ching service endpoints."""

from typing import Optional

import httpx

from ..models.divination import IChingImage, IChingTextRequest, IChingTextResponse


class IChingAPIClient:
    """Client for interacting with I Ching API endpoints."""

    def __init__(self, base_url: str, access_token: str, refresh_token: str):
        """
        Initialize the API client.

        Args:
            base_url (str): The base URL of the API
            access_token (str): User's access token
            refresh_token (str): User's refresh token
        """
        self.base_url = base_url
        self.access_token = access_token
        self.refresh_token = refresh_token

    async def get_iching_text(self, request: IChingTextRequest) -> IChingTextResponse:
        """
        Fetch I Ching text from the API.

        Args:
            request: IChingTextRequest object with parent_coord and child_coord

        Returns:
            IChingTextResponse: Object containing parent and child texts

        Raises:
            httpx.HTTPStatusError: If the request fails
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/divination/iching-text",
                json={
                    "parent_coord": request.parent_coord,
                    "child_coord": request.child_coord,
                },
                params={
                    "access_token": self.access_token,
                    "refresh_token": self.refresh_token,
                },
            )
            response.raise_for_status()
            data = response.json()
            return IChingTextResponse(**data)

    async def get_iching_image(
        self, parent_coord: str, child_coord: str
    ) -> IChingImage:
        """
        Fetch I Ching image URL from the API.

        Args:
            parent_coord (str): Parent hexagram coordinate (e.g. "0-1")
            child_coord (str): Child hexagram coordinate (e.g. "1")

        Returns:
            IChingImage: Object containing coordinates and image URL

        Raises:
            httpx.HTTPStatusError: If the request fails
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/divination/iching-image",
                params={
                    "parent_coord": parent_coord,
                    "child_coord": child_coord,
                    "access_token": self.access_token,
                    "refresh_token": self.refresh_token,
                },
            )
            response.raise_for_status()
            image_url = response.json()
            return IChingImage(
                parent_coord=parent_coord, child_coord=child_coord, image_url=image_url
            )

    async def create_reading(self, reading, prediction: Optional[dict] = None):
        """
        Store a user reading in the database.

        Args:
            reading: UserReadingCreate object with reading details
            prediction (dict, optional): The prediction data to store

        Returns:
            dict: The created reading record

        Raises:
            httpx.HTTPStatusError: If the request fails
        """
        # This is a placeholder for when you implement the readings API endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/readings",
                json={"reading": reading.dict(), "prediction": prediction},
                params={
                    "access_token": self.access_token,
                    "refresh_token": self.refresh_token,
                },
            )
            response.raise_for_status()
            return response.json()
