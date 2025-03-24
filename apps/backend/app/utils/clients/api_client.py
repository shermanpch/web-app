"""API client for interacting with the I Ching service endpoints."""

import httpx

from ...models.divination import (
    IChingCoordinatesRequest,
    IChingCoordinatesResponse,
    IChingImageRequest,
    IChingImageResponse,
    IChingReadingRequest,
    IChingReadingResponse,
    IChingTextRequest,
    IChingTextResponse,
)


class IChingAPIClient:
    """Client for interacting with I Ching API endpoints."""

    def __init__(self, base_url: str, access_token: str, refresh_token: str):
        """
        Initialize the API client.

        Args:
            base_url (str): The base URL of the API
            access_token (str): The access token for the API
            refresh_token (str): The refresh token for the API
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
                    "access_token": request.access_token,
                    "refresh_token": request.refresh_token,
                },
            )
            response.raise_for_status()
            data = response.json()
            return IChingTextResponse(**data)

    async def get_iching_image(
        self, request: IChingImageRequest
    ) -> IChingImageResponse:
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
            response = await client.post(
                f"{self.base_url}/api/divination/iching-image",
                json={
                    "parent_coord": request.parent_coord,
                    "child_coord": request.child_coord,
                    "access_token": request.access_token,
                    "refresh_token": request.refresh_token,
                },
            )
            response.raise_for_status()
            data = response.json()
            return IChingImageResponse(**data)

    async def get_iching_coordinates(
        self, request: IChingCoordinatesRequest
    ) -> IChingCoordinatesResponse:
        """
        Fetch I Ching reading from the API.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/divination/iching-coordinates",
                json={
                    "first_number": request.first_number,
                    "second_number": request.second_number,
                    "third_number": request.third_number,
                },
            )
            response.raise_for_status()
            data = response.json()
            return IChingCoordinatesResponse(**data)

    async def get_iching_reading(
        self, reading: IChingReadingRequest
    ) -> IChingReadingResponse:
        """
        Fetch I Ching reading from the API.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/divination/iching-reading",
                json={
                    "first_number": reading.first_number,
                    "second_number": reading.second_number,
                    "third_number": reading.third_number,
                    "question": reading.question,
                    "access_token": reading.access_token,
                    "refresh_token": reading.refresh_token,
                },
            )
            response.raise_for_status()
            data = response.json()
            return IChingReadingResponse(**data)
