"""Tests for user quota endpoints and functionality."""

import logging

import pytest
from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields

# Get the logger with module name
logger = logging.getLogger(__name__)


class TestUserQuota(BaseTest):
    """Test suite for user quota functionality."""

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
