"""Base test class for API tests."""

import logging
from typing import Any, Dict

import httpx


class BaseTest:
    """Base class for all test suites."""

    def setup_method(self, method):
        """Set up test method."""
        # Use __name__ pattern for logger with class name suffix
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def teardown_method(self, method):
        """Clean up after test method."""
        pass

    def _extract_auth_token(self, auth_headers: Dict[str, str]) -> str:
        """
        Extract bearer token from authorization headers.

        Args:
            auth_headers: Authorization headers dictionary

        Returns:
            str: Bearer token
        """
        auth_header = auth_headers.get("Authorization", "")
        return auth_header.replace("Bearer ", "")

    def _get_user_id(self, client, auth_headers: Dict[str, str]) -> str:
        """
        Get user ID from authenticated request.

        Args:
            client: FastAPI test client
            auth_headers: Authorization headers

        Returns:
            str: User ID
        """
        user_response = client.get("/api/auth/me", headers=auth_headers)
        assert (
            user_response.status_code == 200
        ), f"Failed to get user info: {user_response.text}"
        return user_response.json().get("id")

    def _get_refresh_token(self, client, credentials: Dict[str, str]) -> str:
        """
        Get refresh token by logging in.

        Args:
            client: FastAPI test client
            credentials: User credentials (email and password)

        Returns:
            str: Refresh token
        """
        login_response = client.post("/api/auth/login", json=credentials)
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"

        login_data = login_response.json()
        return login_data["data"]["session"]["refresh_token"]

    def _extract_tokens(self, response) -> Dict[str, str]:
        """
        Extract access and refresh tokens from response.

        Args:
            response: HTTP response object

        Returns:
            Dict containing access_token and refresh_token
        """
        data = response.json().get("data", {})
        session = data.get("session", {})
        return {
            "access_token": session.get("access_token"),
            "refresh_token": session.get("refresh_token"),
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

    def _assert_token_response(self, response) -> None:
        """
        Assert that a response contains valid tokens.

        Args:
            response: HTTP response object
        """
        data = response.json().get("data", {})
        session = data.get("session", {})

        assert "access_token" in session, "Missing access_token in response"
        assert "refresh_token" in session, "Missing refresh_token in response"

        assert session["access_token"], "Empty access_token in response"
        assert session["refresh_token"], "Empty refresh_token in response"

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
