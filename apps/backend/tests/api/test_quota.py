"""Tests for user quota endpoints."""

import logging

import pytest
from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields

# Get the logger with module name
logger = logging.getLogger(__name__)


class TestQuotas(BaseTest):
    """Test suite for user quota endpoints."""

    def test_user_quota_flow(self, client, auth_tokens, auth_cookies, user_cleanup):
        """Test the complete quota flow:
        1. First check if quota exists (should return None)
        2. Create a quota
        3. Check quota again (should now return the created quota)
        """
        # ARRANGE
        self.logger.info("Testing complete user quota flow")

        # Extract user ID for cleanup
        user_id = auth_tokens["user_id"]
        assert user_id, "Failed to get user ID from auth tokens"

        try:
            # Set cookies on the client instance instead of per-request
            client.cookies.set("auth_token", auth_cookies["auth_token"])
            client.cookies.set("refresh_token", auth_cookies["refresh_token"])

            # ACT - Step 1: Check if quota exists using POST endpoint
            self.logger.info("Step 1: Checking if quota exists (should be None)")
            first_request = client.post(
                "/api/user/quota",
                json={"user_id": user_id},
            )

            # ASSERT - first request should return 200 with null or quota
            assert (
                first_request.status_code == 200
            ), f"Unexpected status code: {first_request.status_code}"

            # If content returned, check if it's null/None
            self.logger.info(f"Got response: {first_request.text}")
            if (
                first_request.text.strip()
                and first_request.text.strip().lower() != "null"
            ):
                first_quota = first_request.json()
                self.logger.info(f"Found existing quota: {first_quota}")
                # If a quota already exists, we'll proceed but note it
                self.logger.warning(
                    "Quota already exists for this user, tests may not be reliable"
                )

            # ACT - Step 2: Create a quota
            self.logger.info("Step 2: Creating quota")
            create_request = client.post(
                "/api/user/quota/create",
                json={"user_id": user_id},
            )

            # ASSERT - create request successful
            assert (
                create_request.status_code == 200
            ), f"Failed to create quota: {create_request.text}"
            created_quota = create_request.json()

            # Verify the structure of the created quota
            assert_has_fields(
                created_quota, ["user_id", "membership_type", "remaining_queries"]
            )
            assert (
                created_quota["user_id"] == user_id
            ), f"User ID mismatch in created quota"
            assert (
                created_quota["membership_type"] == "free"
            ), "Unexpected membership type"
            assert (
                created_quota["remaining_queries"] == 10
            ), "Unexpected remaining queries count"

            self.logger.info(f"Quota created successfully: {created_quota}")

            # ACT - Step 3: Check quota again
            self.logger.info("Step 3: Checking quota after creation")
            check_request = client.post(
                "/api/user/quota",
                json={"user_id": user_id},
            )

            # ASSERT - check request successful
            assert (
                check_request.status_code == 200
            ), f"Failed to retrieve quota: {check_request.text}"
            retrieved_quota = check_request.json()

            # Verify it's the same quota
            assert_has_fields(
                retrieved_quota, ["user_id", "membership_type", "remaining_queries"]
            )
            assert (
                retrieved_quota["user_id"] == user_id
            ), f"User ID mismatch in retrieved quota"
            assert (
                retrieved_quota["remaining_queries"]
                == created_quota["remaining_queries"]
            ), f"Quota values don't match. Created: {created_quota['remaining_queries']}, Retrieved: {retrieved_quota['remaining_queries']}"

            self.logger.info("Complete quota flow test passed successfully!")
        finally:
            # CLEANUP
            if user_id:
                user_cleanup(client, user_id, auth_cookies)
