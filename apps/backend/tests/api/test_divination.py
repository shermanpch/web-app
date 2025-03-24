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

    def test_iching_coordinates_conversion(self, client):
        """Test the I-Ching coordinates conversion logic."""
        # ARRANGE
        self.logger.info("Testing I-Ching coordinates conversion")

        # Test numbers
        test_first_number = 42
        test_second_number = 17
        test_third_number = 31

        # Expected coordinates based on modulo arithmetic:
        # first_cord = first % 8 = 42 % 8 = 2
        # second_cord = second % 8 = 17 % 8 = 1
        # So parent_coord should be "2-1"
        # child_cord = third % 6 = 31 % 6 = 1
        expected_parent_coord = "2-1"
        expected_child_coord = "1"

        # ACT
        coordinates_response = client.post(
            "/api/divination/iching-coordinates",
            json={
                "first_number": test_first_number,
                "second_number": test_second_number,
                "third_number": test_third_number,
            },
        )

        # ASSERT
        assert (
            coordinates_response.status_code == 200
        ), f"I-Ching coordinates conversion failed: {coordinates_response.text}"

        # Verify response structure and content
        coordinates_data = coordinates_response.json()
        assert_has_fields(coordinates_data, ["parent_coord", "child_coord"])

        # Verify coordinates match expected values
        assert (
            coordinates_data["parent_coord"] == expected_parent_coord
        ), f"Expected parent_coord {expected_parent_coord}, got {coordinates_data['parent_coord']}"
        assert (
            coordinates_data["child_coord"] == expected_child_coord
        ), f"Expected child_coord {expected_child_coord}, got {coordinates_data['child_coord']}"

        self.logger.info("I-Ching coordinates conversion test passed successfully!")

    def test_iching_reading_authenticated(self, client, auth_tokens, user_cleanup):
        """Test retrieving complete I-Ching reading using authentication."""
        # ARRANGE
        self.logger.info("Testing complete I-Ching reading with authentication")

        # Extract tokens and user ID
        auth_token = auth_tokens["access_token"]
        refresh_token = auth_tokens["refresh_token"]
        user_id = auth_tokens["user_id"]

        # Test data for I-Ching reading
        test_first_number = 42
        test_second_number = 17
        test_third_number = 31
        test_question = "What direction should I take in my career?"
        test_language = "English"

        try:
            # Get the complete I-Ching reading
            # The endpoint now handles getting text and image internally
            reading_response = client.post(
                "/api/divination/iching-reading",
                json={
                    "first_number": test_first_number,
                    "second_number": test_second_number,
                    "third_number": test_third_number,
                    "question": test_question,
                    "language": test_language,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            # ASSERT
            assert (
                reading_response.status_code == 200
            ), f"I-Ching reading retrieval failed: {reading_response.text}"

            # Verify response structure
            reading_data = reading_response.json()
            assert isinstance(reading_data, dict), "Response should be a JSON object"

            # Check that all required fields are present
            assert_has_fields(
                reading_data,
                [
                    "hexagram_name",
                    "summary",
                    "interpretation",
                    "line_change",
                    "result",
                    "advice",
                    "image_path",
                ],
            )

            # Check that line_change and result are properly structured
            assert_has_fields(reading_data["line_change"], ["line", "interpretation"])
            assert_has_fields(reading_data["result"], ["name", "interpretation"])

            # Log the reading data for inspection
            self.logger.info("I-Ching Reading Results:")
            self.logger.info(f"Hexagram Name: {reading_data['hexagram_name']}")
            self.logger.info(f"Summary: {reading_data['summary']}")
            self.logger.info(
                f"Interpretation: {reading_data['interpretation'][:100]}..."
            )
            self.logger.info(
                f"Line Change: {reading_data['line_change']['line']} - {reading_data['line_change']['interpretation'][:50]}..."
            )
            self.logger.info(
                f"Result Hexagram: {reading_data['result']['name']} - {reading_data['result']['interpretation'][:50]}..."
            )
            self.logger.info(f"Advice: {reading_data['advice'][:100]}...")
            self.logger.info(f"Image Path: {reading_data['image_path']}")

            self.logger.info("I-Ching reading test passed successfully!")

        finally:
            # Clean up the test user
            if user_id:
                user_cleanup(client, user_id, auth_token)

    def test_save_iching_reading(self, client, auth_tokens, user_cleanup):
        """Test saving I-Ching reading to the user_readings table."""
        # ARRANGE
        self.logger.info("Testing saving I-Ching reading to database")

        # Extract tokens and user ID
        auth_token = auth_tokens["access_token"]
        refresh_token = auth_tokens["refresh_token"]
        user_id = auth_tokens["user_id"]

        # Test data for I-Ching reading
        test_first_number = 38
        test_second_number = 24
        test_third_number = 16
        test_question = "How should I approach my current challenges?"
        test_language = "English"

        try:
            # STEP 1: First get a real prediction from the iching-reading endpoint
            self.logger.info("Getting real prediction from I-Ching reading API")
            reading_response = client.post(
                "/api/divination/iching-reading",
                json={
                    "first_number": test_first_number,
                    "second_number": test_second_number,
                    "third_number": test_third_number,
                    "question": test_question,
                    "language": test_language,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            assert (
                reading_response.status_code == 200
            ), f"Failed to get I-Ching reading: {reading_response.text}"

            # Get the real prediction data
            reading_data = reading_response.json()
            self.logger.info(
                f"Retrieved real prediction for hexagram: {reading_data['hexagram_name']}"
            )

            # Clarifying questions for our test
            test_clarifying_question = None
            test_clarifying_answer = None

            # STEP 2: Now save this real prediction to the database
            self.logger.info("Saving the real prediction to database")
            save_response = client.post(
                "/api/divination/iching-reading/save",
                json={
                    "user_id": user_id,
                    "question": test_question,
                    "first_number": test_first_number,
                    "second_number": test_second_number,
                    "third_number": test_third_number,
                    "language": test_language,
                    "prediction": reading_data,
                    "clarifying_question": test_clarifying_question,
                    "clarifying_answer": test_clarifying_answer,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            # ASSERT
            assert (
                save_response.status_code == 200
            ), f"I-Ching reading save failed: {save_response.text}"

            # Verify response structure
            save_data = save_response.json()
            assert isinstance(save_data, dict), "Response should be a JSON object"

            # Check that all required fields are present
            assert_has_fields(
                save_data,
                ["id", "user_id", "created_at", "success", "message"],
            )

            # Verify the saved data matches what we sent
            assert (
                save_data["user_id"] == user_id
            ), f"Expected user_id {user_id}, got {save_data['user_id']}"
            assert save_data["success"] is True, "Expected success to be True"

            # Verify we got back a UUID
            reading_id = save_data["id"]
            assert len(reading_id) > 0, "Expected a non-empty reading ID"

            # Log the reading details for inspection
            self.logger.info("I-Ching Reading Save Results:")
            self.logger.info(f"Reading ID: {reading_id}")
            self.logger.info(f"User ID: {save_data['user_id']}")
            self.logger.info(f"Created At: {save_data['created_at']}")
            self.logger.info(f"Success: {save_data['success']}")
            self.logger.info(f"Message: {save_data['message']}")
            self.logger.info("I-Ching reading save test passed successfully!")

        finally:
            # Do not clean up the test user to keep the reading in the database
            pass
