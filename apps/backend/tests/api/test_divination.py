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
        """Test retrieving I-Ching text without authentication."""
        # ARRANGE
        self.logger.info("Testing I-Ching text retrieval without authentication")

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        # Create a fresh client or clear cookies to ensure no auth is present
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        iching_response = client.post(
            "/api/divination/iching-text",
            json={
                "parent_coord": test_parent_coord,
                "child_coord": test_child_coord,
            },
        )

        # ASSERT
        assert (
            iching_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        # Verify error details in response
        error_data = iching_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info("Non-authenticated test passed successfully!")

    def test_iching_text_retrieval_authenticated(
        self, client, auth_tokens, auth_cookies, user_cleanup
    ):
        """Test retrieving I-Ching text using authentication cookies."""
        # ARRANGE
        self.logger.info("Testing I-Ching text retrieval with authentication")

        # Extract user ID for cleanup
        user_id = auth_tokens["user_id"]

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        try:
            # Set cookies on the client instance instead of per-request
            client.cookies.set("auth_token", auth_cookies["auth_token"])
            client.cookies.set("refresh_token", auth_cookies["refresh_token"])

            # ACT - Make the API request
            iching_response = client.post(
                "/api/divination/iching-text",
                json={
                    "parent_coord": test_parent_coord,
                    "child_coord": test_child_coord,
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
                user_cleanup(client, user_id, auth_cookies)

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
        """Test retrieving I-Ching image without authentication."""
        # ARRANGE
        self.logger.info("Testing I-Ching image retrieval without authentication")

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        # Clear any existing cookies
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        iching_response = client.get(
            f"/api/divination/iching-image?parent_coord={test_parent_coord}&child_coord={test_child_coord}"
        )

        # ASSERT
        assert (
            iching_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        self.logger.info("Non-authenticated image retrieval test passed successfully!")

    @pytest.mark.asyncio
    async def test_iching_image_retrieval_authenticated(
        self,
        client,
        auth_tokens,
        auth_cookies,
        user_cleanup,
    ):
        """Test retrieving I-Ching image using authentication cookies."""
        # ARRANGE
        self.logger.info("Testing I-Ching image retrieval with authentication")

        # Extract user ID for cleanup
        user_id = auth_tokens["user_id"]

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        try:
            # Set cookies on the client instance instead of per-request
            client.cookies.set("auth_token", auth_cookies["auth_token"])
            client.cookies.set("refresh_token", auth_cookies["refresh_token"])

            # ACT - Make the API request
            iching_response = client.get(
                f"/api/divination/iching-image?parent_coord={test_parent_coord}&child_coord={test_child_coord}"
            )

            # ASSERT
            assert (
                iching_response.status_code == 200
            ), f"I-Ching image retrieval failed: {iching_response.text}"

            # Verify response headers and content
            assert (
                iching_response.headers["Content-Type"] == "image/jpeg"
            ), "Response should be a JPEG image"
            assert (
                len(iching_response.content) > 0
            ), "Response should contain image data"

            self.logger.info("I-Ching image retrieval test passed successfully!")
        finally:
            # Clean up the test user
            if user_id:
                user_cleanup(client, user_id, auth_cookies)

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

    def test_iching_reading_authenticated(
        self, client, auth_tokens, auth_cookies, user_cleanup
    ):
        """Test generating a complete I Ching reading."""
        # ARRANGE
        self.logger.info("Testing I-Ching reading generation")

        # Extract user ID for cleanup
        user_id = auth_tokens["user_id"]

        # Test input data
        request_data = {
            "first_number": 123,
            "second_number": 456,
            "third_number": 789,
            "question": "What path should I take in life?",
            "language": "en",
        }

        try:
            # Set cookies on the client instance instead of per-request
            client.cookies.set("auth_token", auth_cookies["auth_token"])
            client.cookies.set("refresh_token", auth_cookies["refresh_token"])

            # ACT - Make the API request
            iching_response = client.post(
                "/api/divination/iching-reading",
                json=request_data,
            )

            # ASSERT
            assert (
                iching_response.status_code == 200
            ), f"I-Ching reading retrieval failed: {iching_response.text}"

            # Verify response structure
            reading_data = iching_response.json()
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

            self.logger.info("I-Ching reading test passed successfully!")

        finally:
            # Clean up the test user
            if user_id:
                user_cleanup(client, user_id, auth_cookies)

    def test_save_iching_reading(self, client, auth_tokens, auth_cookies, user_cleanup):
        """Test saving an I Ching reading to the database."""
        # ARRANGE
        self.logger.info("Testing save I-Ching reading")

        # Extract user ID for cleanup
        user_id = auth_tokens["user_id"]

        # Create a reading first
        reading_data = {
            "first_number": 123,
            "second_number": 456,
            "third_number": 789,
            "question": "What should I focus on today?",
            "language": "en",
        }

        try:
            # Set cookies on the client instance instead of per-request
            client.cookies.set("auth_token", auth_cookies["auth_token"])
            client.cookies.set("refresh_token", auth_cookies["refresh_token"])

            # Get a reading first
            reading_response = client.post(
                "/api/divination/iching-reading",
                json=reading_data,
            )

            assert (
                reading_response.status_code == 200
            ), f"Failed to get I-Ching reading: {reading_response.text}"

            # Get the real prediction data
            reading_data = reading_response.json()
            self.logger.info(
                f"Retrieved real prediction for hexagram: {reading_data['hexagram_name']}"
            )
            self.logger.info(
                f"Retrieved real prediction for line change: {reading_data['result']['name']}"
            )

            # STEP 2: Now save this real prediction to the database
            self.logger.info("Saving the real prediction to database")
            save_response = client.post(
                "/api/divination/iching-reading/save",
                json={
                    "user_id": user_id,
                    "question": reading_data["question"],
                    "first_number": reading_data["first_number"],
                    "second_number": reading_data["second_number"],
                    "third_number": reading_data["third_number"],
                    "language": reading_data["language"],
                    "prediction": reading_data,
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

    def test_update_iching_reading(
        self, client, auth_tokens, auth_cookies, user_cleanup
    ):
        """Test updating an I Ching reading with a clarification question."""
        # ARRANGE
        self.logger.info("Testing update I-Ching reading")

        # Extract user ID for cleanup
        user_id = auth_tokens["user_id"]

        # Create and save a reading first
        reading_data = {
            "first_number": 123,
            "second_number": 456,
            "third_number": 789,
            "question": "What should I focus on today?",
            "language": "en",
        }

        try:
            # Set cookies on the client instance instead of per-request
            client.cookies.set("auth_token", auth_cookies["auth_token"])
            client.cookies.set("refresh_token", auth_cookies["refresh_token"])

            # Step 1: Get a reading
            iching_response = client.post(
                "/api/divination/iching-reading",
                json=reading_data,
            )

            assert (
                iching_response.status_code == 200
            ), f"Failed to get I-Ching reading: {iching_response.text}"

            # Get the real prediction data
            reading_data = iching_response.json()
            self.logger.info(
                f"Retrieved real prediction for hexagram: {reading_data['hexagram_name']}"
            )
            self.logger.info(
                f"Retrieved real prediction for line change: {reading_data['result']['name']}"
            )

            # STEP 2: Now save this real prediction to the database
            self.logger.info("Saving the real prediction to database")
            save_response = client.post(
                "/api/divination/iching-reading/save",
                json={
                    "user_id": user_id,
                    "question": reading_data["question"],
                    "first_number": reading_data["first_number"],
                    "second_number": reading_data["second_number"],
                    "third_number": reading_data["third_number"],
                    "language": reading_data["language"],
                    "prediction": reading_data,
                    "clarifying_question": None,
                    "clarifying_answer": None,
                },
            )

            # Verify save was successful
            assert (
                save_response.status_code == 200
            ), f"I-Ching reading save failed: {save_response.text}"

            save_data = save_response.json()
            reading_id = save_data["id"]
            assert save_data["success"] is True, "Expected save to be successful"
            self.logger.info(f"Successfully saved reading with ID: {reading_id}")

            # STEP 3: Update the reading with a clarifying question
            test_clarifying_question = (
                "Can you give me more details about the situation?"
            )
            self.logger.info(
                f"Updating reading with clarifying question: '{test_clarifying_question}'"
            )

            update_response = client.post(
                "/api/divination/iching-reading/update",
                json={
                    "id": reading_id,
                    "user_id": user_id,
                    "question": reading_data["question"],
                    "first_number": reading_data["first_number"],
                    "second_number": reading_data["second_number"],
                    "third_number": reading_data["third_number"],
                    "language": reading_data["language"],
                    "prediction": reading_data,
                    "clarifying_question": test_clarifying_question,
                },
            )

            # ASSERT
            assert (
                update_response.status_code == 200
            ), f"I-Ching reading update failed: {update_response.text}"

            # Verify response structure
            update_data = update_response.json()
            assert isinstance(update_data, dict), "Response should be a JSON object"

            # Check that all required fields are present
            assert_has_fields(
                update_data,
                [
                    "id",
                    "user_id",
                    "question",
                    "clarifying_question",
                    "clarifying_answer",
                    "prediction",
                ],
            )

            # Verify the updated data matches what we sent
            assert (
                update_data["id"] == reading_id
            ), f"Expected reading_id {reading_id}, got {update_data['id']}"
            assert (
                update_data["user_id"] == user_id
            ), f"Expected user_id {user_id}, got {update_data['user_id']}"
            assert (
                update_data["clarifying_question"] == test_clarifying_question
            ), "Clarifying question doesn't match"
            assert (
                update_data["clarifying_answer"] is not None
            ), "Expected clarifying answer to be provided"

            # Log the updated reading details
            self.logger.info("I-Ching Reading Update Results:")
            self.logger.info(f"Reading ID: {update_data['id']}")
            self.logger.info(f"User ID: {update_data['user_id']}")
            self.logger.info(
                f"Clarifying Question: {update_data['clarifying_question']}"
            )
            self.logger.info(
                f"Clarifying Answer: {update_data['clarifying_answer'][:100]}..."
            )
            self.logger.info("I-Ching reading update test passed successfully!")

        finally:
            # Do not clean up the test user to keep the reading in the database
            pass
