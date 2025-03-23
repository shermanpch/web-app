"""Integration tests for the IChingAPIClient."""

import logging
import os

import pytest
from src.clients.api_client import IChingAPIClient
from src.models.divination import IChingImage, IChingTextRequest
from tests.api.base_test import BaseTest

# Get the logger with hierarchical naming
logger = logging.getLogger("tests.api.api_client")


class TestIChingAPIClientIntegration(BaseTest):
    """Integration test suite for the IChingAPIClient."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_iching_text_integration(self, client, auth_tokens, user_cleanup):
        """Integration test for fetching I Ching text using the API client."""
        # ARRANGE
        self.logger.info("Testing API client get_iching_text integration")

        # Extract tokens and user ID
        auth_token = auth_tokens["access_token"]
        refresh_token = auth_tokens["refresh_token"]
        user_id = auth_tokens["user_id"]

        try:
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

            # ACT - Test fetching I Ching text with a real API call
            result = await api_client.get_iching_text(request)

            # ASSERT
            # Verify the result structure
            assert hasattr(
                result, "parent_coord"
            ), "Result missing parent_coord attribute"
            assert hasattr(
                result, "child_coord"
            ), "Result missing child_coord attribute"
            assert hasattr(
                result, "parent_text"
            ), "Result missing parent_text attribute"
            assert hasattr(result, "child_text"), "Result missing child_text attribute"

            # Verify the coordinates match what we requested
            assert (
                result.parent_coord == test_parent_coord
            ), f"Expected parent_coord {test_parent_coord}, got {result.parent_coord}"
            assert (
                result.child_coord == test_child_coord
            ), f"Expected child_coord {test_child_coord}, got {result.child_coord}"

            # Log portions of the parent and child text
            self.logger.info(f"Parent text excerpt: {result.parent_text[:100]}...")
            self.logger.info(f"Child text excerpt: {result.child_text[:100]}...")

            self.logger.info(
                "API client get_iching_text integration test passed successfully!"
            )

        finally:
            # Clean up the test user
            if user_id:
                user_cleanup(client, user_id, auth_token)

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_iching_image_integration(
        self, client, auth_tokens, user_cleanup
    ):
        """Integration test for fetching I Ching image using the API client."""
        # ARRANGE
        self.logger.info("Testing API client get_iching_image integration")

        # Extract tokens and user ID
        auth_token = auth_tokens["access_token"]
        refresh_token = auth_tokens["refresh_token"]
        user_id = auth_tokens["user_id"]

        try:
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

            # ACT - Test fetching I Ching image with a real API call
            result = await api_client.get_iching_image(
                test_parent_coord,
                test_child_coord,
            )

            # ASSERT
            # Verify the result structure
            assert isinstance(
                result, IChingImage
            ), "Result should be an IChingImage instance"

            # Verify the coordinates match what we requested
            assert (
                result.parent_coord == test_parent_coord
            ), f"Expected parent_coord {test_parent_coord}, got {result.parent_coord}"
            assert (
                result.child_coord == test_child_coord
            ), f"Expected child_coord {test_child_coord}, got {result.child_coord}"

            # Verify the image URL is accessible using the standardized helper method
            await self._verify_image_url_accessibility(result.image_url)

            # Verify the image URL structure using the standardized helper method
            self._verify_image_url_structure(
                result.image_url, test_parent_coord, test_child_coord
            )

            self.logger.info(
                "API client get_iching_image integration test passed successfully!"
            )

        finally:
            # Clean up the test user
            if user_id:
                user_cleanup(client, user_id, auth_token)
