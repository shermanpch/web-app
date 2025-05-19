"""Tests for user endpoints and functionality."""

import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple

import pytest
from fastapi.testclient import TestClient

from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields, assert_successful_response

# Get the logger with module name
logger = logging.getLogger(__name__)


class TestUser(BaseTest):
    """Test suite for user endpoints and functionality."""

    def _create_test_reading(self, client: TestClient, user_id: str) -> Dict[str, Any]:
        """Helper method to create a test reading."""
        # Create a reading
        reading_data: Dict[str, Any] = {
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
        prediction: Dict[str, Any] = iching_response.json()

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

    # ========================================================================
    # Reading History Tests
    # ========================================================================

    def test_get_readings_non_authenticated(self, client: TestClient) -> None:
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
        error_data: Dict[str, Any] = readings_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info("Non-authenticated get readings test passed successfully!")

    def test_get_readings_authenticated(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
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

        # Readings are now paginated in a dictionary, not a direct list
        paginated_response: Dict[str, Any] = readings_response.json()
        assert isinstance(paginated_response, dict), "Response should be a JSON object"

        # Access the list of readings using the "items" key
        actual_readings_list: List[Dict[str, Any]] = paginated_response["items"]

        # Verify paginated response structure
        assert_has_fields(
            paginated_response,
            ["items", "total_items", "total_pages", "current_page", "page_size"],
        )

        # If we have readings, verify their structure
        if actual_readings_list:
            self.logger.info(f"Found {len(actual_readings_list)} readings for user")
            first_reading: Dict[str, Any] = actual_readings_list[0]
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
            self.logger.info("No readings found for user (empty items array returned)")

        self.logger.info("Get readings test passed successfully!")

    def test_get_single_reading_non_authenticated(self, client: TestClient) -> None:
        """Test retrieving a single reading without authentication."""
        # ARRANGE
        self.logger.info("Testing retrieving a single reading without authentication")
        reading_id = str(uuid.uuid4())  # Use a dummy ID

        # Clear any existing cookies
        client.cookies.clear()

        # ACT - Make request without auth tokens/cookies
        reading_response = client.get(f"/api/user/readings/{reading_id}")

        # ASSERT
        assert (
            reading_response.status_code == 401
        ), "Request should fail with authentication error when no auth is provided"

        # Verify error details in response
        error_data: Dict[str, Any] = reading_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info(
            "Non-authenticated get single reading test passed successfully!"
        )

    def test_get_single_reading_authenticated(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test retrieving a single reading with authentication."""
        # ARRANGE
        self.logger.info("Testing retrieving a single reading with authentication")
        client, user_id = authenticated_client

        # Step 1: Create a test reading
        save_data: Dict[str, Any] = self._create_test_reading(client, user_id)
        reading_id = save_data["id"]
        self.logger.info(f"Successfully created reading with ID: {reading_id}")

        # Step 2: Get the reading by ID
        self.logger.info(f"Fetching reading with ID: {reading_id}")
        reading_response = client.get(f"/api/user/readings/{reading_id}")

        # ASSERT
        assert (
            reading_response.status_code == 200
        ), f"Get single reading failed: {reading_response.text}"

        # Verify the retrieved reading
        reading_data: Dict[str, Any] = reading_response.json()
        assert isinstance(reading_data, dict), "Response should be a JSON object"

        # Check that all required fields are present
        assert_has_fields(
            reading_data,
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

        # Verify the reading data matches what we created
        assert (
            reading_data["id"] == reading_id
        ), f"Expected reading ID {reading_id}, got {reading_data['id']}"
        assert (
            str(reading_data["user_id"]) == user_id
        ), f"Expected user ID {user_id}, got {reading_data['user_id']}"

        self.logger.info("Get single reading test passed successfully!")

    def test_get_nonexistent_reading(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test retrieving a nonexistent reading."""
        # ARRANGE
        self.logger.info("Testing retrieving a nonexistent reading")
        client, user_id = authenticated_client
        nonexistent_id = str(uuid.uuid4())

        # ACT - Try to get a reading that doesn't exist
        reading_response = client.get(f"/api/user/readings/{nonexistent_id}")

        # ASSERT
        assert (
            reading_response.status_code == 500
        ), f"Expected 500 for nonexistent reading, got {reading_response.status_code}"

        error_data: Dict[str, Any] = reading_response.json()
        assert "detail" in error_data, "Response should contain error details"
        self.logger.info("Get nonexistent reading test passed successfully!")

    def test_delete_nonexistent_reading(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test deleting a nonexistent reading."""
        # ARRANGE
        self.logger.info("Testing deleting a nonexistent reading")
        client, user_id = authenticated_client
        nonexistent_id = str(uuid.uuid4())

        # ACT - Try to delete a reading that doesn't exist
        delete_response = client.delete(f"/api/user/readings/{nonexistent_id}")

        # ASSERT
        assert (
            delete_response.status_code == 404
        ), f"Expected 404 for nonexistent reading, got {delete_response.status_code}"

        error_data: Dict[str, Any] = delete_response.json()
        assert "detail" in error_data, "Response should contain error details"

    def test_delete_single_reading_non_authenticated(self, client: TestClient) -> None:
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
        error_data: Dict[str, Any] = delete_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info(
            "Non-authenticated delete single reading test passed successfully!"
        )

    def test_delete_all_readings_non_authenticated(self, client: TestClient) -> None:
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
        error_data: Dict[str, Any] = delete_response.json()
        assert "detail" in error_data, "Response should contain error details"
        assert (
            "Authentication" in error_data["detail"]
        ), "Error should mention authentication"

        self.logger.info(
            "Non-authenticated delete all readings test passed successfully!"
        )

    def test_delete_single_reading_authenticated(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test deleting a single reading with authentication."""
        # ARRANGE
        self.logger.info("Testing deleting a single reading with authentication")
        client, user_id = authenticated_client

        # Step 1: Create a test reading
        save_data: Dict[str, Any] = self._create_test_reading(client, user_id)
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
        delete_data: Dict[str, Any] = delete_response.json()
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
        paginated_response = readings_response.json()
        for reading in paginated_response["items"]:
            assert (
                reading["id"] != reading_id
            ), f"Reading {reading_id} should have been deleted"

        self.logger.info("Delete single reading test passed successfully!")

    def test_delete_all_readings_authenticated(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test deleting all readings with authentication."""
        # ARRANGE
        self.logger.info("Testing deleting all readings with authentication")
        client, user_id = authenticated_client

        # Step 1: Create multiple test readings
        num_readings = 3
        created_readings: List[Dict[str, Any]] = []
        for i in range(num_readings):
            save_data = self._create_test_reading(client, user_id)
            created_readings.append(save_data)
            self.logger.info(f"Created test reading {i + 1} with ID: {save_data['id']}")

        # Step 2: Verify readings were created
        readings_response = client.get("/api/user/readings")
        assert readings_response.status_code == 200, "Failed to get readings"
        paginated_response: Dict[str, Any] = readings_response.json()
        assert (
            paginated_response["total_items"] >= num_readings
        ), "Not all test readings were created"

        # Step 3: Delete all readings
        self.logger.info("Deleting all readings")
        delete_response = client.delete("/api/user/readings")

        # ASSERT
        assert (
            delete_response.status_code == 200
        ), f"Delete all readings failed: {delete_response.text}"

        # Verify response structure
        delete_data: Dict[str, Any] = delete_response.json()
        assert isinstance(delete_data, dict), "Response should be a JSON object"
        assert "message" in delete_data, "Response should contain a message"

        # Step 4: Verify all readings were deleted
        final_response = client.get("/api/user/readings")
        assert (
            final_response.status_code == 200
        ), "Failed to get readings after deletion"
        final_paginated_data: Dict[str, Any] = final_response.json()
        assert final_paginated_data["total_items"] == 0, "Not all readings were deleted"

        self.logger.info("Delete all readings test passed successfully!")

    # ========================================================================
    # User Quota Tests
    # ========================================================================

    @pytest.mark.asyncio
    async def test_get_user_profile_status(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test retrieving user profile status with quotas."""
        # ARRANGE
        self.logger.info("Testing user profile status retrieval")
        client, user_id = authenticated_client

        # ACT - Get the user's profile status
        profile_response = client.get("/api/user/profile")

        # ASSERT
        assert_successful_response(profile_response)
        profile_data = profile_response.json()

        # Verify response matches UserProfileStatusResponse model
        assert_has_fields(profile_data, ["profile", "quotas"])

        # Verify profile data structure
        profile = profile_data["profile"]
        assert_has_fields(
            profile,
            [
                "id",
                "membership_tier_id",
                "membership_tier_name",
                "premium_expiration",
                "created_at",
                "updated_at",
            ],
        )
        assert str(profile["id"]) == user_id
        assert isinstance(profile["membership_tier_name"], str)
        assert isinstance(profile["membership_tier_id"], int)

        # Verify quotas list structure
        quotas = profile_data["quotas"]
        assert isinstance(quotas, list)
        if quotas:  # If any quotas exist
            first_quota = quotas[0]
            assert_has_fields(
                first_quota,
                [
                    "feature_id",
                    "feature_name",
                    "limit",
                    "used",
                    "remaining",
                    "resets_at",
                ],
            )
            assert isinstance(first_quota["feature_id"], int)
            assert isinstance(first_quota["feature_name"], str)
            assert isinstance(first_quota["used"], int)
            assert first_quota["used"] >= 0

            # If there's a limit, verify remaining is calculated correctly
            if first_quota["limit"] is not None:
                assert isinstance(first_quota["limit"], int)
                assert first_quota["limit"] >= 0
                assert (
                    first_quota["remaining"]
                    == first_quota["limit"] - first_quota["used"]
                )
            else:
                assert first_quota["remaining"] is None

        self.logger.info("User profile status test passed successfully!")

    def test_get_profile_non_authenticated(self, client: TestClient) -> None:
        """Test retrieving user profile without authentication."""
        # ARRANGE
        self.logger.info("Testing retrieving user profile without authentication")
        client.cookies.clear()

        # ACT
        profile_response = client.get("/api/user/profile")

        # ASSERT
        assert profile_response.status_code == 401
        error_data = profile_response.json()
        assert "detail" in error_data
        assert "Authentication" in error_data["detail"]

    def test_upgrade_membership(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test upgrading user membership to premium."""
        # ARRANGE
        self.logger.info("Testing user membership upgrade")
        client, user_id = authenticated_client

        # ACT - Upgrade the membership
        upgrade_response = client.post("/api/user/profile/upgrade")

        # ASSERT
        assert_successful_response(upgrade_response)
        profile_data = upgrade_response.json()

        # Verify response matches UserProfileResponse model
        assert_has_fields(
            profile_data,
            [
                "id",
                "membership_tier_id",
                "membership_tier_name",
                "premium_expiration",
                "created_at",
                "updated_at",
            ],
        )

        # Verify premium status
        assert str(profile_data["id"]) == user_id
        assert profile_data["membership_tier_name"] == "premium"
        assert profile_data["premium_expiration"] is not None

        # Verify the change is reflected in the profile endpoint
        profile_response = client.get("/api/user/profile")
        assert_successful_response(profile_response)
        full_profile = profile_response.json()
        assert full_profile["profile"]["membership_tier_name"] == "premium"
        assert (
            full_profile["profile"]["premium_expiration"]
            == profile_data["premium_expiration"]
        )

        self.logger.info("User membership upgrade test passed successfully!")
