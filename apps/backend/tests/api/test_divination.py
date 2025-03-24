"""Tests for divination endpoints."""

import logging

import pytest
from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields

# Get the logger with module name
logger = logging.getLogger(__name__)


class TestDivination(BaseTest):
    """Test suite for divination endpoints."""

    def test_iching_text_retrieval_non_authenticated(self, client):
        """Test retrieving I-Ching text without providing authentication tokens."""
        # ARRANGE
        self.logger.info("Testing I-Ching text retrieval without authentication")

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        # ACT - Make request without auth tokens - this should trigger validation error
        iching_response = client.post(
            "/api/divination/iching-text",
            json={
                "parent_coord": test_parent_coord,
                "child_coord": test_child_coord,
                # access_token and refresh_token are required but missing
            },
        )

        # ASSERT
        assert (
            iching_response.status_code == 422
        ), "Request should fail with validation error when tokens are missing"

        # Verify error details in response
        error_data = iching_response.json()
        assert "detail" in error_data, "Response should contain error details"

        # Check for specific error messages about missing tokens
        assert any(
            "access_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing access_token"
        assert any(
            "refresh_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing refresh_token"

        self.logger.info("Non-authenticated token test passed successfully!")

    def test_iching_text_retrieval_authenticated(
        self, client, auth_tokens, user_cleanup
    ):
        """Test retrieving I-Ching text using access and refresh tokens."""
        # ARRANGE
        self.logger.info("Testing I-Ching text retrieval with authentication")

        # Extract tokens and user ID
        auth_token = auth_tokens["access_token"]
        refresh_token = auth_tokens["refresh_token"]
        user_id = auth_tokens["user_id"]

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        try:
            # ACT - Make the API request with tokens in the request body using the model
            iching_response = client.post(
                "/api/divination/iching-text",
                json={
                    "parent_coord": test_parent_coord,
                    "child_coord": test_child_coord,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            # ASSERT
            assert (
                iching_response.status_code == 200
            ), f"I-Ching text retrieval failed: {iching_response.text}"

            # Verify response structure and content
            iching_data = iching_response.json()
            assert_has_fields(
                iching_data,
                ["parent_coord", "child_coord", "parent_text", "child_text"],
            )

            # Verify coordinates match request
            assert (
                iching_data["parent_coord"] == test_parent_coord
            ), f"Expected parent_coord {test_parent_coord}, got {iching_data['parent_coord']}"
            assert (
                iching_data["child_coord"] == test_child_coord
            ), f"Expected child_coord {test_child_coord}, got {iching_data['child_coord']}"

            # Log a preview of the text content for debugging
            self._log_text_preview(iching_data)

            self.logger.info("I-Ching text retrieval test passed successfully!")
        finally:
            # Clean up the test user
            if user_id:
                user_cleanup(client, user_id, auth_token)

    def _log_text_preview(self, iching_data):
        """Log preview of parent and child text content."""
        parent_text = iching_data.get("parent_text", "")
        child_text = iching_data.get("child_text", "")

        if parent_text:
            preview = parent_text[:50] + "..." if len(parent_text) > 50 else parent_text
            self.logger.info(f"Parent text preview: {preview}")

        if child_text:
            preview = child_text[:50] + "..." if len(child_text) > 50 else child_text
            self.logger.info(f"Child text preview: {preview}")

    def test_iching_image_retrieval_non_authenticated(self, client):
        """Test retrieving I-Ching image without providing authentication tokens."""
        # ARRANGE
        self.logger.info("Testing I-Ching image retrieval without authentication")

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        # ACT - Make request without auth tokens - using POST with model structure
        iching_response = client.post(
            "/api/divination/iching-image",
            json={
                "parent_coord": test_parent_coord,
                "child_coord": test_child_coord,
                # access_token and refresh_token are required but missing
            },
        )

        # ASSERT
        assert (
            iching_response.status_code == 422
        ), "Request should fail with validation error when tokens are missing"

        # Verify error details in response
        error_data = iching_response.json()
        assert "detail" in error_data, "Response should contain error details"

        # Check for specific error messages about missing tokens
        assert any(
            "access_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing access_token"
        assert any(
            "refresh_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing refresh_token"

        self.logger.info("Non-authenticated image retrieval test passed successfully!")

    @pytest.mark.asyncio
    async def test_iching_image_retrieval_authenticated(
        self, client, auth_tokens, user_cleanup
    ):
        """Test retrieving I-Ching image using access and refresh tokens."""
        # ARRANGE
        self.logger.info("Testing I-Ching image retrieval with authentication")

        # Extract tokens and user ID
        auth_token = auth_tokens["access_token"]
        refresh_token = auth_tokens["refresh_token"]
        user_id = auth_tokens["user_id"]

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        try:
            # ACT - Use POST with model structure - all parameters in the request body
            iching_response = client.post(
                "/api/divination/iching-image",
                json={
                    "parent_coord": test_parent_coord,
                    "child_coord": test_child_coord,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            # ASSERT
            assert (
                iching_response.status_code == 200
            ), f"I-Ching image retrieval failed: {iching_response.text}"

            # Verify response structure
            image_data = iching_response.json()
            assert isinstance(image_data, dict), "Response should be a JSON object"
            assert_has_fields(image_data, ["parent_coord", "child_coord", "image_url"])

            # Verify the coordinates match what we requested
            assert (
                image_data["parent_coord"] == test_parent_coord
            ), f"Expected parent_coord {test_parent_coord}, got {image_data['parent_coord']}"
            assert (
                image_data["child_coord"] == test_child_coord
            ), f"Expected child_coord {test_child_coord}, got {image_data['child_coord']}"

            # Verify the image URL format and components using standardized helper
            image_url = image_data["image_url"]
            self._verify_image_url_structure(
                image_url, test_parent_coord, test_child_coord
            )

            # Verify the image URL is accessible using standardized helper
            await self._verify_image_url_accessibility(image_url)

            self.logger.info("I-Ching image retrieval test passed successfully!")
        finally:
            # Clean up the test user
            if user_id:
                user_cleanup(client, user_id, auth_token)
