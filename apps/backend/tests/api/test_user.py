"""Tests for user endpoints and functionality."""

import logging
import uuid
from typing import Any, Dict

import pytest

from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields

# Get the logger with module name
logger = logging.getLogger(__name__)


class TestUser(BaseTest):
    """Test suite for user endpoints and functionality."""

    # ========================================================================
    # Reading History Tests
    # ========================================================================

    def test_get_readings_non_authenticated(self, client):
        """Test retrieving user readings without authentication."""
        # ARRANGE
        self.logger.info("Testing retrieving user readings without authentication")

        # Create a fresh client or clear cookies to ensure no auth is present
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        readings_response = client.get("/api/user/readings")

        # ASSERT
        assert (
            readings_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        # Verify error details in response
        error_data = readings_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info("Non-authenticated get readings test passed successfully!")

    def test_get_readings_authenticated(self, authenticated_client):
        """Test retrieving user readings with authentication."""
        # ARRANGE
        self.logger.info("Testing retrieving user readings with authentication")
        client, user_id = authenticated_client

        # ACT - Make the API request
        readings_response = client.get("/api/user/readings")

        # ASSERT
        assert (
            readings_response.status_code == 200
        ), f"User readings retrieval failed: {readings_response.text}"

        # Readings might be empty, but response should be a list
        readings_data = readings_response.json()
        assert isinstance(readings_data, list), "Response should be a JSON array"

        # If we have readings, verify their structure
        if readings_data:
            self.logger.info(f"Found {len(readings_data)} readings for user")
            first_reading = readings_data[0]
            assert_has_fields(
                first_reading,
                [
                    "id",
                    "user_id",
                    "question",
                    "first_number",
                    "second_number",
                    "third_number",
                    "language",
                    "created_at",
                ],
            )
        else:
            self.logger.info("No readings found for user (empty array returned)")

        self.logger.info("Get readings test passed successfully!")

    def _create_test_reading(self, client: Any, user_id: str) -> Dict[str, Any]:
        """Helper method to create a test reading."""
        # Create a reading
        reading_data = {
            "first_number": 123,
            "second_number": 456,
            "third_number": 789,
            "question": f"Test question {uuid.uuid4()}",
            "language": "en",
        }

        # Get a prediction
        iching_response = client.post(
            "/api/divination/iching-reading",
            json=reading_data,
        )
        assert iching_response.status_code == 200, "Failed to get I-Ching reading"
        prediction = iching_response.json()

        # Save the reading
        save_response = client.post(
            "/api/divination/iching-reading/save",
            json={
                "user_id": user_id,
                "question": reading_data["question"],
                "first_number": reading_data["first_number"],
                "second_number": reading_data["second_number"],
                "third_number": reading_data["third_number"],
                "language": reading_data["language"],
                "prediction": prediction,
            },
        )
        assert save_response.status_code == 200, "Failed to save reading"

        return save_response.json()

    def test_delete_single_reading_non_authenticated(self, client):
        """Test deleting a single reading without authentication."""
        # ARRANGE
        self.logger.info("Testing deleting a single reading without authentication")
        reading_id = "00000000-0000-0000-0000-000000000000"  # Dummy ID

        # Clear any existing cookies
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        delete_response = client.delete(f"/api/user/readings/{reading_id}")

        # ASSERT
        assert (
            delete_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        # Verify error details in response
        error_data = delete_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info(
            "Non-authenticated delete single reading test passed successfully!"
        )

    def test_delete_all_readings_non_authenticated(self, client):
        """Test deleting all readings without authentication."""
        # ARRANGE
        self.logger.info("Testing deleting all readings without authentication")

        # Clear any existing cookies
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        delete_response = client.delete("/api/user/readings")

        # ASSERT
        assert (
            delete_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        # Verify error details in response
        error_data = delete_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info(
            "Non-authenticated delete all readings test passed successfully!"
        )

    def test_delete_single_reading_authenticated(self, authenticated_client):
        """Test deleting a single reading with authentication."""
        # ARRANGE
        self.logger.info("Testing deleting a single reading with authentication")
        client, user_id = authenticated_client

        # Step 1: Create a test reading
        save_data = self._create_test_reading(client, user_id)
        reading_id = save_data["id"]
        self.logger.info(f"Successfully created reading with ID: {reading_id}")

        # Step 2: Delete the reading
        self.logger.info(f"Deleting reading with ID: {reading_id}")
        delete_response = client.delete(f"/api/user/readings/{reading_id}")

        # ASSERT
        assert (
            delete_response.status_code == 200
        ), f"Delete reading failed: {delete_response.text}"

        # Verify response structure
        delete_data = delete_response.json()
        assert isinstance(delete_data, dict), "Response should be a JSON object"

        # Check that all required fields are present
        assert_has_fields(
            delete_data,
            ["success", "reading_id", "user_id", "message"],
        )

        # Verify the deleted data matches what we sent
        assert delete_data["success"] is True, "Expected success to be True"
        assert (
            str(uuid.UUID(delete_data["reading_id"])) == reading_id
        ), f"Expected reading_id {reading_id}, got {delete_data['reading_id']}"
        assert (
            str(uuid.UUID(delete_data["user_id"])) == user_id
        ), f"Expected user_id {user_id}, got {delete_data['user_id']}"

        # Step 3: Verify the reading is actually deleted by trying to fetch all readings
        readings_response = client.get("/api/user/readings")
        assert readings_response.status_code == 200, "Failed to get readings"

        # Check if the deleted reading is missing from the list
        readings = readings_response.json()
        for reading in readings:
            assert (
                reading["id"] != reading_id
            ), f"Reading {reading_id} should have been deleted"

        self.logger.info("Delete single reading test passed successfully!")

    def test_delete_nonexistent_reading(self, authenticated_client):
        """Test deleting a reading that doesn't exist."""
        # ARRANGE
        self.logger.info("Testing deleting a nonexistent reading")
        client, user_id = authenticated_client
        nonexistent_id = str(uuid.uuid4())

        # ACT - Try to delete a nonexistent reading
        delete_response = client.delete(f"/api/user/readings/{nonexistent_id}")

        # ASSERT
        assert (
            delete_response.status_code == 404
        ), f"Expected 404 error, got {delete_response.status_code}"

        # Verify error details in response
        error_data = delete_response.json()
        assert "detail" in error_data, "Response should contain error details"
        self.logger.info(f"Error message: {error_data['detail']}")

        self.logger.info("Delete nonexistent reading test passed successfully!")

    def test_delete_all_readings_authenticated(self, authenticated_client):
        """Test deleting all readings with authentication."""
        # ARRANGE
        self.logger.info("Testing deleting all readings with authentication")
        client, user_id = authenticated_client

        # Step 1: Create multiple test readings
        for i in range(3):  # Create 3 readings
            save_data = self._create_test_reading(client, user_id)
            self.logger.info(f"Created reading {i+1} of 3: {save_data['id']}")

        # Verify we have readings
        verify_response = client.get("/api/user/readings")
        assert verify_response.status_code == 200, "Failed to get readings"
        readings = verify_response.json()
        initial_count = len(readings)
        assert (
            initial_count > 0
        ), "Expected to have at least one reading before deletion"
        self.logger.info(f"Verified {initial_count} readings exist before deletion")

        # Step 2: Delete all readings
        self.logger.info("Deleting all readings")
        delete_response = client.delete("/api/user/readings")

        # ASSERT
        assert (
            delete_response.status_code == 200
        ), f"Delete all readings failed: {delete_response.text}"

        # Verify response structure
        delete_data = delete_response.json()
        assert isinstance(delete_data, dict), "Response should be a JSON object"

        # Check that all required fields are present
        assert_has_fields(
            delete_data,
            ["success", "reading_id", "user_id", "message"],
        )

        # Verify the deleted data matches what we expect
        assert delete_data["success"] is True, "Expected success to be True"
        assert (
            str(uuid.UUID(delete_data["user_id"])) == user_id
        ), f"Expected user_id {user_id}, got {delete_data['user_id']}"

        # Step 3: Verify all readings are actually deleted
        readings_response = client.get("/api/user/readings")
        assert (
            readings_response.status_code == 200
        ), "Failed to get readings after deletion"

        # Check if the readings list is empty
        readings = readings_response.json()
        assert (
            len(readings) == 0
        ), f"Expected all readings to be deleted, but found {len(readings)}"

        self.logger.info("Delete all readings test passed successfully!")

    # ========================================================================
    # User Quota Tests
    # ========================================================================

    @pytest.mark.asyncio
    async def test_quota_auto_creation_and_manual_decrement(self, authenticated_client):
        """
        Verify quota is auto-created on signup and can be manually decremented.
        """
        # ARRANGE
        self.logger.info("Starting test: Automatic quota creation and manual decrement")
        client, user_id = authenticated_client

        self.logger.info(f"Test user created with ID: {user_id}")

        # ACT 1: Fetch initial quota immediately after signup/login
        self.logger.info("Fetching initial quota for the new user...")
        initial_quota_response = client.get("/api/user/quota")

        # ASSERT 1: Verify the initial quota state is correct (default values)
        assert (
            initial_quota_response.status_code == 200
        ), f"Failed to fetch initial quota: {initial_quota_response.text}"
        initial_quota_data = initial_quota_response.json()
        assert initial_quota_data, "Initial quota data should not be empty or None"

        # Check against UserQuotaResponse model fields
        assert_has_fields(
            initial_quota_data, ["user_id", "membership_type", "remaining_queries"]
        )
        assert (
            initial_quota_data["user_id"] == user_id
        ), f"Quota user_id ({initial_quota_data['user_id']}) does not match test user ({user_id})"
        assert (
            initial_quota_data["membership_type"] == "free"
        ), f"Default membership type should be 'free', got '{initial_quota_data['membership_type']}'"
        assert (
            initial_quota_data["remaining_queries"] == 10
        ), f"Default remaining queries should be 10, got {initial_quota_data['remaining_queries']}"

        initial_queries = initial_quota_data["remaining_queries"]
        self.logger.info(
            f"Initial quota verified: User {user_id} has {initial_queries} queries, type: {initial_quota_data['membership_type']}"
        )

        # ACT 2: Explicitly call the endpoint to decrement the quota
        self.logger.info("Calling the /api/user/quota/decrement endpoint...")
        decrement_response = client.post("/api/user/quota/decrement")

        # ASSERT 2: Verify the response from the decrement endpoint shows the updated count
        assert (
            decrement_response.status_code == 200
        ), f"Failed to decrement quota via API: {decrement_response.text}"
        decrement_data = decrement_response.json()
        assert decrement_data, "Decrement response data should not be empty or None"

        # Check against UpdateUserQuotaResponse model fields
        assert_has_fields(
            decrement_data, ["user_id", "membership_type", "remaining_queries"]
        )
        decremented_queries = decrement_data["remaining_queries"]
        self.logger.info(
            f"Decrement endpoint returned successfully. Remaining queries in response: {decremented_queries}"
        )
        assert (
            decremented_queries == initial_queries - 1
        ), f"Expected decrement response queries ({decremented_queries}) to be initial ({initial_queries}) minus 1"
        assert (
            decrement_data["user_id"] == user_id
        ), f"Decrement response user_id ({decrement_data['user_id']}) does not match test user ({user_id})"

        # ACT 3: Fetch the quota again to ensure the change was persisted in the database
        self.logger.info("Fetching quota again to verify persistence of decrement...")
        final_quota_response = client.get("/api/user/quota")

        # ASSERT 3: Verify the final persisted quota state matches the decremented value
        assert (
            final_quota_response.status_code == 200
        ), f"Failed to fetch final quota after decrement: {final_quota_response.text}"
        final_quota_data = final_quota_response.json()
        assert final_quota_data, "Final quota data should not be empty or None"
        assert_has_fields(
            final_quota_data, ["user_id", "membership_type", "remaining_queries"]
        )
        final_queries = final_quota_data["remaining_queries"]
        self.logger.info(
            f"Final quota fetched after decrement operation. Remaining queries: {final_queries}"
        )

        # Check if the persisted value is correct
        assert (
            final_queries == initial_queries - 1
        ), f"Expected persisted queries ({final_queries}) to be initial ({initial_queries}) minus 1"
        # Double-check against the value returned by the decrement endpoint itself
        assert (
            final_queries == decremented_queries
        ), f"Persisted queries ({final_queries}) should match the value returned by the decrement endpoint ({decremented_queries})"

        self.logger.info("Quota decrement persistence verified successfully!")
        self.logger.info(
            "Test completed: Quota auto-creation and manual decrement verified."
        )

    def test_get_quota_non_authenticated(self, client):
        """Test retrieving user quota without authentication."""
        # ARRANGE
        self.logger.info("Testing retrieving user quota without authentication")

        # Create a fresh client or clear cookies to ensure no auth is present
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        quota_response = client.get("/api/user/quota")

        # ASSERT
        assert (
            quota_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        # Verify error details in response
        error_data = quota_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info("Non-authenticated get quota test passed successfully!")

    def test_decrement_quota_non_authenticated(self, client):
        """Test decrementing user quota without authentication."""
        # ARRANGE
        self.logger.info("Testing decrementing user quota without authentication")

        # Create a fresh client or clear cookies to ensure no auth is present
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        quota_response = client.post("/api/user/quota/decrement")

        # ASSERT
        assert (
            quota_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        # Verify error details in response
        error_data = quota_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info("Non-authenticated decrement quota test passed successfully!")
