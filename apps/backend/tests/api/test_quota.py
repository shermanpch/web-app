"""Tests for user quota endpoints."""

import logging

import pytest
from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields

# Get the logger with hierarchical naming
logger = logging.getLogger("tests.api.quota")


class TestQuotas(BaseTest):
    """Test suite for user quota endpoints."""

    def test_user_quota_authenticated(self, client, auth_tokens, user_cleanup):
        """Test that default quotas are created when none exist for a user."""
        # ARRANGE
        self.logger.info("Testing user quota with authentication")

        # Extract tokens and user ID
        auth_token = auth_tokens["access_token"]
        refresh_token = auth_tokens["refresh_token"]
        user_id = auth_tokens["user_id"]
        assert user_id, "Failed to get user ID from auth tokens"

        try:
            # ACT - Step 1: Make first quota request (this should create a default quota)
            first_request = client.get(
                "/api/divination/user-quota",
                params={
                    "user_id": user_id,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            # ASSERT - first request successful
            assert (
                first_request.status_code == 200
            ), f"Failed to get/create quota: {first_request.text}"
            first_quota = first_request.json()

            # Verify the structure of the created quota
            assert_has_fields(
                first_quota, ["user_id", "membership_type", "remaining_queries"]
            )
            assert (
                first_quota["user_id"] == user_id
            ), f"User ID mismatch in created quota"
            assert (
                first_quota["membership_type"] == "free"
            ), "Unexpected membership type"
            assert (
                first_quota["remaining_queries"] == 10
            ), "Unexpected remaining queries count"

            # Log the created quota details
            self.logger.info(f"Default quota created successfully: {first_quota}")

            # ACT - Step 2: Make a second request to verify the quota persists
            second_request = client.get(
                "/api/divination/user-quota",
                params={
                    "user_id": user_id,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            # ASSERT - second request returns same quota
            assert (
                second_request.status_code == 200
            ), f"Failed to retrieve persisted quota: {second_request.text}"
            second_quota = second_request.json()

            # Verify it's the same quota (same remaining_queries value)
            assert (
                second_quota["remaining_queries"] == first_quota["remaining_queries"]
            ), f"Quota not properly persisted. First: {first_quota['remaining_queries']}, Second: {second_quota['remaining_queries']}"

            self.logger.info(
                "Default quota creation and persistence test passed successfully!"
            )
        finally:
            # CLEANUP
            if user_id:
                user_cleanup(client, user_id, auth_token)

    def test_user_quota_non_authenticated(self, client):
        """Test retrieving user quota without authentication."""
        # ARRANGE & ACT
        self.logger.info("Testing user quota without authentication")

        # Make request without auth tokens
        quota_response = client.get(
            "/api/divination/user-quota",
        )

        # ASSERT
        assert (
            quota_response.status_code == 422
        ), "Unauthenticated request should return unprocessable entity status"

        # Verify error details in response
        error_data = quota_response.json()
        assert "detail" in error_data, "Error response should contain detail field"

        # Check if any of the validation errors mention required parameters
        assert isinstance(
            error_data["detail"], list
        ), "Detail should be a list of validation errors"

        has_required_param_error = any(
            "required" in str(item).lower() or "missing" in str(item).lower()
            for item in error_data["detail"]
        )
        assert (
            has_required_param_error
        ), "Validation error should mention required parameters"

        self.logger.info("Non-authenticated quota test passed successfully!")

    def test_user_quota_missing_tokens(self, client, auth_headers, user_cleanup):
        """Test retrieving user quota with auth headers but without required tokens in query params."""
        # ARRANGE
        self.logger.info("Testing user quota with missing query tokens")

        # Extract bearer token from auth_headers for cleanup
        auth_token = self._extract_auth_token(auth_headers)

        # Get user ID for cleanup
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json().get("id") if user_response.status_code == 200 else None
        )

        try:
            # ACT - Make request with auth headers but without required query parameters
            quota_response = client.get(
                "/api/divination/user-quota",
                headers=auth_headers,
            )

            # ASSERT
            assert (
                quota_response.status_code == 422
            ), "Request should fail with validation error when tokens missing from query"

            # Verify error details in response
            error_data = quota_response.json()
            assert "detail" in error_data, "Error response should contain detail field"
            assert isinstance(
                error_data["detail"], list
            ), "Detail should be a list of validation errors"

            # Extract missing parameter names from validation errors
            missing_params = self._extract_missing_params(error_data["detail"])
            self.logger.info(
                f"Missing parameters according to validation errors: {missing_params}"
            )

            # Verify expected parameters are mentioned
            expected_params = ["user_id", "access_token", "refresh_token"]
            for param in expected_params:
                assert (
                    param in missing_params
                ), f"Validation errors should mention missing '{param}' parameter"

            self.logger.info("Missing tokens validation test passed successfully!")
        finally:
            # CLEANUP
            if user_id:
                user_cleanup(client, user_id, auth_token)

    def _extract_missing_params(self, detail_list):
        """Extract missing parameter names from validation error details."""
        missing_params = []
        for item in detail_list:
            if isinstance(item, dict) and "loc" in item:
                param_path = item["loc"]
                if len(param_path) >= 2 and param_path[0] == "query":
                    missing_params.append(param_path[1])
        return missing_params
