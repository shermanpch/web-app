"""Tests for divination endpoints."""

import logging
from typing import Any

from fastapi.testclient import TestClient

from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields


# Get the logger with module name
logger = logging.getLogger(__name__)


class TestDivination(BaseTest):
    """Test suite for divination endpoints."""

    def test_iching_text_retrieval_non_authenticated(self, client: TestClient) -> None:
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
        assert iching_response.status_code == 401, (
            "Request should fail with authentication error when no auth is provided"
        )

        # Verify error details in response
        error_data: dict[str, Any] = iching_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert "Authentication" in error_data["detail"], (
            "Error should mention authentication"
        )

        self.logger.info("Non-authenticated test passed successfully!")

    def test_iching_text_retrieval_authenticated(
        self, authenticated_client: tuple[TestClient, str | None]
    ) -> None:
        """Test retrieving I-Ching text using authentication cookies."""
        # ARRANGE
        self.logger.info("Testing I-Ching text retrieval with authentication")
        client, user_id = authenticated_client

        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        # ACT - Make the API request
        iching_response = client.post(
            "/api/divination/iching-text",
            json={
                "parent_coord": test_parent_coord,
                "child_coord": test_child_coord,
            },
        )

        # ASSERT
        assert iching_response.status_code == 200, (
            f"I-Ching text retrieval failed: {iching_response.text}"
        )

        # Verify response structure and content
        iching_data: dict[str, Any] = iching_response.json()
        assert_has_fields(
            iching_data,
            ["parent_coord", "child_coord", "parent_json", "child_json"],
        )

        # Verify coordinates match request
        assert iching_data["parent_coord"] == test_parent_coord, (
            f"Expected parent_coord {test_parent_coord}, got {iching_data['parent_coord']}"
        )
        assert iching_data["child_coord"] == test_child_coord, (
            f"Expected child_coord {test_child_coord}, got {iching_data['child_coord']}"
        )

        # Log a preview of the text content for debugging
        self._log_text_preview(iching_data)

        self.logger.info("I-Ching text retrieval test passed successfully!")

    def _log_text_preview(self, iching_data: dict[str, Any]) -> None:
        """Log preview of parent and child text content."""
        parent_json = iching_data.get("parent_json", "")
        child_json = iching_data.get("child_json", "")

        if parent_json:
            preview = parent_json[:50] + "..." if len(parent_json) > 50 else parent_json
            self.logger.info(f"Parent text preview: {preview}")

        if child_json:
            preview = child_json[:50] + "..." if len(child_json) > 50 else child_json
            self.logger.info(f"Child text preview: {preview}")

    def test_iching_coordinates_conversion(self, client: TestClient) -> None:
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
        assert coordinates_response.status_code == 200, (
            f"I-Ching coordinates conversion failed: {coordinates_response.text}"
        )

        # Verify response structure and content
        coordinates_data: dict[str, Any] = coordinates_response.json()
        assert_has_fields(coordinates_data, ["parent_coord", "child_coord"])

        # Verify coordinates match expected values
        assert coordinates_data["parent_coord"] == expected_parent_coord, (
            f"Expected parent_coord {expected_parent_coord}, got {coordinates_data['parent_coord']}"
        )
        assert coordinates_data["child_coord"] == expected_child_coord, (
            f"Expected child_coord {expected_child_coord}, got {coordinates_data['child_coord']}"
        )

        self.logger.info("I-Ching coordinates conversion test passed successfully!")

    def test_iching_reading_basic_mode_authenticated(
        self, authenticated_client: tuple[TestClient, str | None]
    ) -> None:
        """Test generating a complete I Ching reading in basic mode."""
        # ARRANGE
        self.logger.info("Testing I-Ching basic mode reading generation")
        client, user_id = authenticated_client

        # Test input data
        request_data = {
            "question": "What path should I take in life?",
            "mode": "basic",
            "language": "en",
            "first_number": 123,
            "second_number": 456,
            "third_number": 789,
        }

        # ACT - Make the API request
        iching_response = client.post(
            "/api/divination/iching-reading",
            json=request_data,
        )

        # ASSERT
        assert iching_response.status_code == 200, (
            f"I-Ching reading retrieval failed: {iching_response.text}"
        )

        # Verify response structure
        reading_data = iching_response.json()
        assert isinstance(reading_data, dict), "Response should be a JSON object"

        # Check that all required fields are present
        assert_has_fields(
            reading_data,
            [
                "mode",
                "hexagram_name",
                "pinyin",
                "summary",
                "interpretation",
                "line_change",
                "result",
                "advice",
            ],
        )

        # Verify mode is basic
        assert reading_data["mode"] == "basic", "Expected mode to be 'basic'"

        # Check that deep_dive_details is None or not present for basic mode
        assert reading_data.get("deep_dive_details") is None, (
            "deep_dive_details should be None for basic mode"
        )

        # Check that line_change and result are properly structured
        assert_has_fields(reading_data["line_change"], ["line", "interpretation"])
        assert_has_fields(reading_data["result"], ["name", "pinyin", "interpretation"])

        # Log the reading data for inspection
        # fmt:off
        self.logger.info("I-Ching Reading Results:")
        self.logger.info(f"  Question: {request_data.get('question', 'N/A')}")
        self.logger.info(f"  Mode: {reading_data.get('mode', 'N/A')}")
        self.logger.info(f"  Language: {request_data.get('language', 'N/A')}")
        self.logger.info(f"  First Number: {reading_data.get('first_number', 'N/A')}")
        self.logger.info(f"  Second Number: {reading_data.get('second_number', 'N/A')}")
        self.logger.info(f"  Third Number: {reading_data.get('third_number', 'N/A')}")
        self.logger.info(f"  Hexagram Name: {reading_data.get('hexagram_name', 'N/A')}")
        self.logger.info(f"  Pinyin: {reading_data.get('pinyin', 'N/A')}")
        self.logger.info(f"  Summary: {reading_data.get('summary', 'N/A')}")
        self.logger.info(f"  Interpretation: {reading_data.get('interpretation', 'N/A')[:100]}...")

        # Format line_change as separate lines
        self.logger.info("  Line Change:")
        self.logger.info(f"    Line: {reading_data.get('line_change', {}).get('line', 'N/A')}")
        self.logger.info(f"    Interpretation: {reading_data.get('line_change', {}).get('interpretation', '')[:50]}...")

        # Format result as separate lines
        self.logger.info("  Result Hexagram:")
        self.logger.info(f"    Name: {reading_data.get('result', {}).get('name', 'N/A')}")
        self.logger.info(f"    Pinyin: {reading_data.get('result', {}).get('pinyin', 'N/A')}")
        self.logger.info(f"    Interpretation: {reading_data.get('result', {}).get('interpretation', '')[:50]}...")
        self.logger.info(f"  Advice: {reading_data.get('advice', '')[:100]}...")

        # Log deep dive details (should be None for basic mode)
        deep_dive_details = reading_data.get("deep_dive_details")
        self.logger.info(f"  Deep Dive Details: {'N/A' if deep_dive_details is None else deep_dive_details}")
        # fmt:on

        self.logger.info("I-Ching basic mode reading test passed successfully!")

    def test_iching_reading_deep_dive_mode_authenticated(
        self, authenticated_client: tuple[TestClient, str | None]
    ) -> None:
        """Test generating a complete I Ching reading in deep dive mode."""
        self.logger.info("Testing I-Ching deep dive reading generation")
        client, user_id = authenticated_client

        request_data = {
            "question": "How can I improve my career prospects?",
            "mode": "deep_dive",
            "language": "en",
            "first_number": 234,
            "second_number": 567,
            "third_number": 890,
            "deep_dive_context": {
                "area_of_life": "Career",
                "background_situation": "Feeling stuck in my current role.",
                "current_feelings": ["Anxious", "Hopeful"],
                "desired_outcome": "Clarity on next steps",
            },
        }

        iching_response = client.post(
            "/api/divination/iching-reading",
            json=request_data,
        )

        assert iching_response.status_code == 200, (
            f"I-Ching deep dive reading retrieval failed: {iching_response.text}"
        )

        reading_data = iching_response.json()
        assert isinstance(reading_data, dict), "Response should be a JSON object"

        # Assert basic fields are present
        assert_has_fields(
            reading_data,
            [
                "mode",
                "hexagram_name",
                "pinyin",
                "summary",
                "interpretation",
                "line_change",
                "result",
                "advice",
            ],
        )
        assert reading_data["mode"] == "deep_dive"

        # Assert deep_dive_details is present and structured correctly
        assert "deep_dive_details" in reading_data, (
            "deep_dive_details should be present for deep_dive mode"
        )
        deep_dive_details = reading_data["deep_dive_details"]
        assert deep_dive_details is not None, "deep_dive_details should not be None"

        assert_has_fields(
            deep_dive_details,
            [
                "expanded_primary_interpretation",
                "contextual_changing_line_interpretation",
                "expanded_transformed_interpretation",
                "thematic_connections",
                "actionable_insights_and_reflections",
                # "potential_pitfalls", # Optional
                # "key_strengths", # Optional
            ],
        )
        assert isinstance(deep_dive_details["thematic_connections"], list)

        # Log the reading data for inspection
        # fmt:off
        self.logger.info("I-Ching Deep Dive Reading Results:")
        self.logger.info(f"  Question: {request_data.get('question', 'N/A')}")
        self.logger.info(f"  Mode: {reading_data.get('mode', 'N/A')}")
        self.logger.info(f"  Language: {request_data.get('language', 'N/A')}")
        self.logger.info(f"  First Number: {reading_data.get('first_number', 'N/A')}")
        self.logger.info(f"  Second Number: {reading_data.get('second_number', 'N/A')}")
        self.logger.info(f"  Third Number: {reading_data.get('third_number', 'N/A')}")
        self.logger.info(f"  Hexagram Name: {reading_data.get('hexagram_name', 'N/A')}")
        self.logger.info(f"  Pinyin: {reading_data.get('pinyin', 'N/A')}")
        self.logger.info(f"  Summary: {reading_data.get('summary', 'N/A')}")
        self.logger.info(f"  Interpretation: {reading_data.get('interpretation', 'N/A')[:100]}...")

        # Format line_change as separate lines
        self.logger.info("  Line Change:")
        self.logger.info(f"    Line: {reading_data.get('line_change', {}).get('line', 'N/A')}")
        self.logger.info(f"    Interpretation: {reading_data.get('line_change', {}).get('interpretation', '')[:50]}...")

        # Format result as separate lines
        self.logger.info("  Result Hexagram:")
        self.logger.info(f"    Name: {reading_data.get('result', {}).get('name', 'N/A')}")
        self.logger.info(f"    Pinyin: {reading_data.get('result', {}).get('pinyin', 'N/A')}")
        self.logger.info(f"    Interpretation: {reading_data.get('result', {}).get('interpretation', '')[:50]}...")
        self.logger.info(f"  Advice: {reading_data.get('advice', '')[:100]}...")

        # Log deep dive details
        self.logger.info("  Deep Dive Details:")
        if deep_dive_details:
            self.logger.info(f"    Expanded Primary Interpretation: {deep_dive_details.get('expanded_primary_interpretation', 'N/A')[:100]}...")
            self.logger.info(f"    Contextual Changing Line Interpretation: {deep_dive_details.get('contextual_changing_line_interpretation', 'N/A')[:100]}...")
            self.logger.info(f"    Expanded Transformed Interpretation: {deep_dive_details.get('expanded_transformed_interpretation', 'N/A')[:100]}...")

            thematic_connections = deep_dive_details.get('thematic_connections', [])
            self.logger.info(f"    Thematic Connections: {', '.join(thematic_connections) if thematic_connections else 'N/A'}")

            self.logger.info(f"    Actionable Insights and Reflections: {deep_dive_details.get('actionable_insights_and_reflections', 'N/A')[:100]}...")

            potential_pitfalls = deep_dive_details.get('potential_pitfalls')
            self.logger.info(f"    Potential Pitfalls: {'N/A' if potential_pitfalls is None else potential_pitfalls[:100]}")

            key_strengths = deep_dive_details.get('key_strengths')
            self.logger.info(f"    Key Strengths: {'N/A' if key_strengths is None else key_strengths[:100]}")
        else:
            self.logger.info(f"    {'N/A'}")
        # fmt:on

        self.logger.info("I-Ching deep dive reading test passed successfully!")

    def test_save_iching_reading(
        self, authenticated_client: tuple[TestClient, str | None]
    ) -> None:
        """Test saving an I Ching reading to the database."""
        # ARRANGE
        self.logger.info("Testing save I-Ching reading")
        client, user_id = authenticated_client

        # Create a reading first
        reading_data = {
            "question": "What should I focus on today?",
            "mode": "basic",
            "language": "en",
            "first_number": 123,
            "second_number": 456,
            "third_number": 789,
        }

        # Get a reading first
        reading_response = client.post(
            "/api/divination/iching-reading",
            json=reading_data,
        )

        assert reading_response.status_code == 200, (
            f"Failed to get I-Ching reading: {reading_response.text}"
        )

        # Get the real prediction data
        reading_data = reading_response.json()
        self.logger.info(
            f"Retrieved real prediction for hexagram: {reading_data.get('hexagram_name', 'N/A')}"
        )
        self.logger.info(
            f"Retrieved real prediction for line change: {reading_data.get('result', {}).get('name', 'N/A')}"
        )

        # STEP 2: Now save this real prediction to the database
        self.logger.info("Saving the real prediction to database")
        save_response = client.post(
            "/api/divination/iching-reading/save",
            json={
                "user_id": user_id,
                "question": reading_data.get("question", ""),
                "mode": reading_data.get("mode", "basic"),
                "language": reading_data.get("language", "en"),
                "first_number": reading_data.get("first_number", 0),
                "second_number": reading_data.get("second_number", 0),
                "third_number": reading_data.get("third_number", 0),
                "prediction": reading_data,
            },
        )

        # ASSERT
        assert save_response.status_code == 200, (
            f"I-Ching reading save failed: {save_response.text}"
        )

        # Verify response structure
        save_data = save_response.json()
        assert isinstance(save_data, dict), "Response should be a JSON object"

        # Check that all required fields are present
        assert_has_fields(
            save_data,
            ["id", "user_id", "created_at", "success", "message"],
        )

        # Verify the saved data matches what we sent
        assert save_data["user_id"] == user_id, (
            f"Expected user_id {user_id}, got {save_data['user_id']}"
        )
        assert save_data["success"] is True, "Expected success to be True"

        # Verify we got back a UUID
        reading_id = save_data.get("id")
        assert len(reading_id) > 0, "Expected a non-empty reading ID"

        # Log the reading details for inspection
        self.logger.info("I-Ching Reading Save Results:")
        self.logger.info(f"Reading ID: {reading_id}")
        self.logger.info(f"User ID: {save_data.get('user_id', 'N/A')}")
        self.logger.info(f"Created At: {save_data.get('created_at', 'N/A')}")
        self.logger.info(f"Success: {save_data.get('success', False)}")
        self.logger.info(f"Message: {save_data.get('message', 'N/A')}")
        self.logger.info("I-Ching reading save test passed successfully!")

    def test_update_iching_reading(
        self, authenticated_client: tuple[TestClient, str | None]
    ) -> None:
        """Test updating an I Ching reading with a clarification question."""
        # ARRANGE
        self.logger.info("Testing update I-Ching reading")
        client, user_id = authenticated_client

        # Create and save a reading first
        reading_data = {
            "question": "How can I improve my career prospects?",
            "mode": "deep_dive",
            "language": "en",
            "first_number": 234,
            "second_number": 567,
            "third_number": 890,
            "deep_dive_context": {
                "area_of_life": "Career",
                "background_situation": "Feeling stuck in my current role.",
                "current_feelings": ["Anxious", "Hopeful"],
                "desired_outcome": "Clarity on next steps",
            },
        }

        # Step 1: Get a reading
        iching_response = client.post(
            "/api/divination/iching-reading",
            json=reading_data,
        )

        assert iching_response.status_code == 200, (
            f"Failed to get I-Ching reading: {iching_response.text}"
        )

        # Get the real prediction data
        reading_data = iching_response.json()
        self.logger.info(
            f"Retrieved real prediction for hexagram: {reading_data.get('hexagram_name', 'N/A')}"
        )
        self.logger.info(
            f"Retrieved real prediction for line change: {reading_data.get('result', {}).get('name', 'N/A')}"
        )

        # STEP 2: Now save this real prediction to the database
        self.logger.info("Saving the real prediction to database")
        save_response = client.post(
            "/api/divination/iching-reading/save",
            json={
                "user_id": user_id,
                "question": reading_data.get("question", ""),
                "mode": reading_data.get("mode", "basic"),
                "language": reading_data.get("language", "en"),
                "first_number": reading_data.get("first_number", 0),
                "second_number": reading_data.get("second_number", 0),
                "third_number": reading_data.get("third_number", 0),
                "prediction": reading_data,
                "clarifying_question": None,
                "clarifying_answer": None,
            },
        )

        # Verify save was successful
        assert save_response.status_code == 200, (
            f"I-Ching reading save failed: {save_response.text}"
        )

        save_data = save_response.json()
        reading_id = save_data.get("id")
        assert save_data.get("success") is True, "Expected save to be successful"
        self.logger.info(f"Successfully saved reading with ID: {reading_id}")

        # STEP 3: Update the reading with a clarifying question
        test_clarifying_question = "Can you give me more details about the situation?"
        self.logger.info(
            f"Updating reading with clarifying question: '{test_clarifying_question}'"
        )

        update_response = client.post(
            "/api/divination/iching-reading/update",
            json={
                "id": reading_id,
                "user_id": user_id,
                "question": reading_data.get("question", ""),
                "mode": reading_data.get("mode", "basic"),
                "language": reading_data.get("language", "en"),
                "first_number": reading_data.get("first_number", 0),
                "second_number": reading_data.get("second_number", 0),
                "third_number": reading_data.get("third_number", 0),
                "prediction": reading_data,
                "clarifying_question": test_clarifying_question,
            },
        )

        # ASSERT
        assert update_response.status_code == 200, (
            f"I-Ching reading update failed: {update_response.text}"
        )

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
        assert update_data["id"] == reading_id, (
            f"Expected reading_id {reading_id}, got {update_data['id']}"
        )
        assert update_data["user_id"] == user_id, (
            f"Expected user_id {user_id}, got {update_data['user_id']}"
        )
        assert update_data["clarifying_question"] == test_clarifying_question, (
            "Clarifying question doesn't match"
        )
        assert update_data["clarifying_answer"] is not None, (
            "Expected clarifying answer to be provided"
        )

        # Log the updated reading details
        # fmt:off
        self.logger.info("I-Ching Reading Update Results:")
        self.logger.info(f"Reading ID: {update_data.get('id', 'N/A')}")
        self.logger.info(f"User ID: {update_data.get('user_id', 'N/A')}")
        self.logger.info(f"Question: {update_data.get('question', 'N/A')}")
        self.logger.info(f"Mode: {update_data.get('mode', 'N/A')}")
        self.logger.info(f"Language: {update_data.get('language', 'N/A')}")
        self.logger.info(f"First Number: {update_data.get('first_number', 'N/A')}")
        self.logger.info(f"Second Number: {update_data.get('second_number', 'N/A')}")
        self.logger.info(f"Third Number: {update_data.get('third_number', 'N/A')}")

        # Log prediction details
        prediction = update_data.get('prediction', {})
        self.logger.info(f"Hexagram Name: {prediction.get('hexagram_name', 'N/A')}")
        self.logger.info(f"Pinyin: {prediction.get('pinyin', 'N/A')}")
        self.logger.info(f"Summary: {prediction.get('summary', 'N/A')}")
        self.logger.info(f"Interpretation: {prediction.get('interpretation', 'N/A')[:100]}...")

        # Format line_change as separate lines
        self.logger.info("Line Change:")
        self.logger.info(f"  Line: {prediction.get('line_change', {}).get('line', 'N/A')}")
        self.logger.info(f"  Interpretation: {prediction.get('line_change', {}).get('interpretation', '')[:50]}...")

        # Format result as separate lines
        self.logger.info("Result Hexagram:")
        self.logger.info(f"  Name: {prediction.get('result', {}).get('name', 'N/A')}")
        self.logger.info(f"  Pinyin: {prediction.get('result', {}).get('pinyin', 'N/A')}")
        self.logger.info(f"  Interpretation: {prediction.get('result', {}).get('interpretation', '')[:50]}...")
        self.logger.info(f"Advice: {prediction.get('advice', '')[:100]}...")

        # Log deep dive details
        self.logger.info("Deep Dive Details:")
        deep_dive_details = prediction.get('deep_dive_details')
        if deep_dive_details:
            self.logger.info(f"  Expanded Primary Interpretation: {deep_dive_details.get('expanded_primary_interpretation', 'N/A')[:100]}...")
            self.logger.info(f"  Contextual Changing Line Interpretation: {deep_dive_details.get('contextual_changing_line_interpretation', 'N/A')[:100]}...")
            self.logger.info(f"  Expanded Transformed Interpretation: {deep_dive_details.get('expanded_transformed_interpretation', 'N/A')[:100]}...")

            thematic_connections = deep_dive_details.get('thematic_connections', [])
            self.logger.info(f"  Thematic Connections: {', '.join(thematic_connections) if thematic_connections else 'N/A'}")

            self.logger.info(f"  Actionable Insights and Reflections: {deep_dive_details.get('actionable_insights_and_reflections', 'N/A')[:100]}...")

            potential_pitfalls = deep_dive_details.get('potential_pitfalls')
            self.logger.info(f"  Potential Pitfalls: {'N/A' if potential_pitfalls is None else potential_pitfalls[:100]}")

            key_strengths = deep_dive_details.get('key_strengths')
            self.logger.info(f"  Key Strengths: {'N/A' if key_strengths is None else key_strengths[:100]}")
        else:
            self.logger.info(f"  {'N/A'}")

        # Log clarification details
        self.logger.info("Clarification Details:")
        self.logger.info(f"  Clarifying Question: {update_data.get('clarifying_question', 'N/A')}")
        self.logger.info(f"  Clarifying Answer: {update_data.get('clarifying_answer', '')[:100]}...")

        self.logger.info("I-Ching reading update test passed successfully!")
        # fmt:on
