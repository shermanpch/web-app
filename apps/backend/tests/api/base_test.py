"""Base test class for API tests."""

import logging
from typing import Any, Dict

import httpx


class BaseTest:
    """Base class for all test suites."""

    def setup_method(self, method):
        """Set up test method."""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def teardown_method(self, method):
        """Clean up after test method."""
        pass

    def _get_user_id(self, client, auth_cookies: Dict[str, str]) -> str:
        """
        Get user ID from authenticated request using cookies.

        Args:
            client: FastAPI test client
            auth_cookies: Authentication cookies dict

        Returns:
            str: User ID
        """
        # Set cookies on the client instance
        client.cookies.set("auth_token", auth_cookies["auth_token"])
        client.cookies.set("refresh_token", auth_cookies["refresh_token"])

        user_response = client.get("/api/auth/me")
        assert (
            user_response.status_code == 200
        ), f"Failed to get user info: {user_response.text}"
        return user_response.json().get("id")

    def _extract_tokens_from_cookies(self, response) -> Dict[str, str]:
        """
        Extract access and refresh tokens from response cookies.

        Args:
            response: HTTP response object

        Returns:
            Dict containing access_token and refresh_token
        """
        cookies = response.cookies
        access_token = cookies.get("auth_token")
        refresh_token = cookies.get("refresh_token")

        assert access_token, "Failed to extract access token from cookies"
        assert refresh_token, "Failed to extract refresh token from cookies"

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def _extract_user_data(self, response) -> Dict[str, Any]:
        """
        Extract user data from response.

        Args:
            response: HTTP response object

        Returns:
            Dict containing user data
        """
        data = response.json().get("data", {})
        return data.get("user", {})

    def _verify_image_url_structure(
        self, url: str, parent_coord: str, child_coord: str
    ) -> str:
        """
        Verify image URL has expected structure and components.

        Args:
            url: The image URL to validate
            parent_coord: Expected parent coordinate to be found in URL
            child_coord: Expected child coordinate to be found in URL

        Returns:
            str: The validated URL
        """
        # Basic URL validation
        assert isinstance(url, str), "Image URL should be a string"
        assert url.startswith("http"), "Image URL should be valid"

        # Verify URL contains expected path components
        assert (
            parent_coord in url or parent_coord.replace("-", "/") in url
        ), f"URL should contain '{parent_coord}'"
        assert child_coord in url, f"URL should contain '{child_coord}'"
        assert "hexagram.jpg" in url, "URL should contain 'hexagram.jpg'"

        # Log the URL for debugging
        self.logger.info(f"Image URL: {url[:50]}..." if len(url) > 50 else url)

        return url

    async def _verify_image_url_accessibility(self, url: str) -> None:
        """
        Verify the given URL is accessible via HTTP request.

        Args:
            url: The URL to verify accessibility
        """
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(url)
            assert (
                response.status_code == 200
            ), f"Image URL returned status code {response.status_code}"
