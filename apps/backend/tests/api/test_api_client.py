"""Integration tests for the IChingAPIClient."""

import logging
import os

import pytest
from src.clients.api_client import IChingAPIClient
from src.models.divination import IChingImage, IChingTextRequest

# Get the logger
logger = logging.getLogger("api_client_tests")


class TestIChingAPIClientIntegration:
    """Integration test suite for the IChingAPIClient."""

    def _cleanup_test_user(self, client, user_id, token):
        """Helper method to clean up test user."""
        if user_id and token:
            headers = {"Authorization": f"Bearer {token}"}
            delete_response = client.delete(
                f"/api/auth/users/{user_id}", headers=headers
            )
            logger.info(
                f"Cleanup: Deleted user {user_id}, status: {delete_response.status_code}"
            )
            return delete_response
        return None

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_iching_text_integration(self, client, test_user, auth_headers):
        """Integration test for fetching I Ching text using the API client."""
        # Extract bearer token from auth_headers
        auth_token = auth_headers["Authorization"].replace("Bearer ", "")
        logger.info(f"Using auth token: {auth_token[:10]}...")

        # Get user ID for cleanup
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json().get("id") if user_response.status_code == 200 else None
        )

        try:
            # Get a refresh token - do a login
            login_response = client.post("/api/auth/login", json=test_user)
            assert (
                login_response.status_code == 200
            ), f"Login failed: {login_response.text}"

            # Extract refresh token
            login_data = login_response.json()
            refresh_token = login_data["data"]["session"]["refresh_token"]
            logger.info(f"Using refresh token: {refresh_token[:10]}...")

            # Determine the base URL for the API
            base_url = os.environ.get("API_BASE_URL", "http://localhost:8000")
            # For the TestClient, we use an empty string as base_url
            if isinstance(client.app, type):  # If client.app is a FastAPI class
                base_url = ""

            # Create an instance of the API client
            api_client = IChingAPIClient(
                base_url=base_url,
                access_token=auth_token,
                refresh_token=refresh_token,
            )

            # Test coordinates
            test_parent_coord = "1-1"
            test_child_coord = "2"

            # Create a request object
            request = IChingTextRequest(
                parent_coord=test_parent_coord,
                child_coord=test_child_coord,
            )

            # Test fetching I Ching text with a real API call
            result = await api_client.get_iching_text(request)

            # Verify the result structure
            assert hasattr(result, "parent_coord")
            assert hasattr(result, "child_coord")
            assert hasattr(result, "parent_text")
            assert hasattr(result, "child_text")

            # Verify the coordinates match what we requested
            assert result.parent_coord == test_parent_coord
            assert result.child_coord == test_child_coord

            # Log portions of the parent and child text
            logger.info(f"Parent text excerpt: {result.parent_text[:100]}...")
            logger.info(f"Child text excerpt: {result.child_text[:100]}...")

            logger.info(
                "API client get_iching_text integration test passed successfully!"
            )

        finally:
            # Clean up the test user
            if user_id:
                self._cleanup_test_user(client, user_id, auth_token)

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_iching_image_integration(self, client, test_user, auth_headers):
        """Integration test for fetching I Ching image using the API client."""
        # Extract bearer token from auth_headers
        auth_token = auth_headers["Authorization"].replace("Bearer ", "")
        logger.info(f"Using auth token: {auth_token[:10]}...")

        # Get user ID for cleanup
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json().get("id") if user_response.status_code == 200 else None
        )

        try:
            # Get a refresh token - do a login
            login_response = client.post("/api/auth/login", json=test_user)
            assert (
                login_response.status_code == 200
            ), f"Login failed: {login_response.text}"

            # Extract refresh token
            login_data = login_response.json()
            refresh_token = login_data["data"]["session"]["refresh_token"]
            logger.info(f"Using refresh token: {refresh_token[:10]}...")

            # Determine the base URL for the API
            base_url = os.environ.get("API_BASE_URL", "http://localhost:8000")
            # For the TestClient, we use an empty string as base_url
            if isinstance(client.app, type):  # If client.app is a FastAPI class
                base_url = ""

            # Create an instance of the API client
            api_client = IChingAPIClient(
                base_url=base_url,
                access_token=auth_token,
                refresh_token=refresh_token,
            )

            # Test coordinates
            test_parent_coord = "1-1"
            test_child_coord = "2"

            # Test fetching I Ching image with a real API call
            result = await api_client.get_iching_image(
                test_parent_coord, test_child_coord
            )

            # Verify the result structure
            assert isinstance(result, IChingImage)
            assert hasattr(result, "parent_coord")
            assert hasattr(result, "child_coord")
            assert hasattr(result, "image_url")

            # Verify the coordinates match what we requested
            assert result.parent_coord == test_parent_coord
            assert result.child_coord == test_child_coord

            # Verify the image URL is valid
            assert isinstance(result.image_url, str)
            assert result.image_url.startswith("http")

            # Verify the URL contains expected path components
            assert (
                test_parent_coord in result.image_url
                or test_parent_coord.replace("-", "/") in result.image_url
            )
            assert test_child_coord in result.image_url
            assert "hexagram.jpg" in result.image_url

            # Log the complete image URL
            logger.info(f"Retrieved image URL: {result.image_url}")

            logger.info(
                "API client get_iching_image integration test passed successfully!"
            )

        finally:
            # Clean up the test user
            if user_id:
                self._cleanup_test_user(client, user_id, auth_token)
