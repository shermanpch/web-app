"""Tests for user quota endpoints."""

import logging

import pytest
from fastapi import status

# Get the logger
logger = logging.getLogger("quota_tests")


class TestQuotas:
    """Test suite for user quota endpoints."""

    def _cleanup_test_user(self, client, user_id, token):
        """Helper method to clean up test user."""
        if user_id and token:
            headers = {"Authorization": f"Bearer {token}"}
            delete_response = client.delete(
                f"/api/auth/users/{user_id}", headers=headers
            )
            logger.info(
                f"Cleanup: Deleted user {user_id}, status: {delete_response.status_code}"
            )
            return delete_response
        return None

    def test_user_quota_authenticated(self, test_user, client, auth_headers):
        """Test that default quotas are created when none exist for a user."""
        # Extract bearer token from auth_headers
        auth_token = auth_headers["Authorization"].replace("Bearer ", "")
        logger.info(f"Using auth token: {auth_token[:10]}...")

        # Get user ID
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json().get("id") if user_response.status_code == 200 else None
        )
        assert user_id, "Failed to get user ID from auth headers"

        try:
            # Get a refresh token
            login_response = client.post("/api/auth/login", json=test_user)
            assert (
                login_response.status_code == 200
            ), f"Login failed: {login_response.text}"

            # Extract refresh token
            login_data = login_response.json()
            refresh_token = login_data["data"]["session"]["refresh_token"]
            logger.info(f"Using refresh token: {refresh_token[:10]}...")

            # Step 1: Make first quota request (this should create a default quota)
            first_request = client.get(
                "/api/divination/user-quota",
                params={
                    "user_id": user_id,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            assert first_request.status_code == 200, "Failed to get/create quota"
            first_quota = first_request.json()

            # Verify the structure of the created quota
            assert "user_id" in first_quota, "Missing user_id in created quota"
            assert (
                "membership_type" in first_quota
            ), "Missing membership_type in created quota"
            assert (
                "remaining_queries" in first_quota
            ), "Missing remaining_queries in created quota"
            assert (
                first_quota["user_id"] == user_id
            ), "User ID mismatch in created quota"
            assert (
                first_quota["membership_type"] == "free"
            ), "Unexpected membership type"
            assert (
                first_quota["remaining_queries"] == 10
            ), "Unexpected remaining queries count"

            # Log the created quota details
            logger.info(f"Default quota created successfully: {first_quota}")

            # Step 2: Make a second request to verify the quota persists
            second_request = client.get(
                "/api/divination/user-quota",
                params={
                    "user_id": user_id,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            assert (
                second_request.status_code == 200
            ), "Failed to retrieve persisted quota"
            second_quota = second_request.json()

            # Verify it's the same quota (same remaining_queries value)
            assert (
                second_quota["remaining_queries"] == first_quota["remaining_queries"]
            ), (
                "Quota not properly persisted. First request: "
                f"{first_quota['remaining_queries']}, Second request: "
                f"{second_quota['remaining_queries']}"
            )

            logger.info(
                "Default quota creation and persistence test passed successfully!"
            )
        finally:
            # Clean up the test user
            if user_id:
                self._cleanup_test_user(client, user_id, auth_token)

    def test_user_quota_non_authenticated(self, client):
        """Test retrieving user quota without authentication."""
        # Make request without auth tokens
        quota_response = client.get(
            "/api/divination/user-quota",
        )

        # Verify the request fails with the correct status code
        assert (
            quota_response.status_code == 422
        ), "Unauthenticated request should return unprocessable entity status"

        # Log the error response for debugging
        error_data = quota_response.json()
        logger.info(
            f"Expected error response for non-authenticated request: {error_data}"
        )

        # Verify error details contain validation information
        assert "detail" in error_data, "Error response should contain detail field"
        # Typically, a 422 error includes details about missing required parameters
        assert isinstance(
            error_data["detail"], list
        ), "Detail should be a list of validation errors"

        # Check if any of the validation errors mention required parameters
        has_required_param_error = any(
            "required" in str(item).lower() or "missing" in str(item).lower()
            for item in error_data["detail"]
        )
        assert (
            has_required_param_error
        ), "Validation error should mention required parameters"

        logger.info("Non-authenticated quota test passed successfully!")

    def test_user_quota_missing_tokens(self, client, auth_headers):
        """Test retrieving user quota with auth headers but without required tokens in query params."""
        # Extract bearer token from auth_headers for cleanup
        auth_token = auth_headers["Authorization"].replace("Bearer ", "")

        # Get user ID for cleanup
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json().get("id") if user_response.status_code == 200 else None
        )

        try:
            # Make request with auth headers but without required query parameters
            quota_response = client.get(
                "/api/divination/user-quota",
                headers=auth_headers,
            )

            # Verify the request fails with validation error
            assert (
                quota_response.status_code == 422
            ), "Request should fail with validation error when tokens missing from query"

            # Log the error response for debugging
            error_data = quota_response.json()
            logger.info(f"Expected validation error response: {error_data}")

            # Verify error details contain validation information
            assert "detail" in error_data, "Error response should contain detail field"
            assert isinstance(
                error_data["detail"], list
            ), "Detail should be a list of validation errors"

            # Check for specific parameters in validation errors
            missing_params = []
            for item in error_data["detail"]:
                if isinstance(item, dict) and "loc" in item:
                    param_path = item["loc"]
                    if len(param_path) >= 2 and param_path[0] == "query":
                        missing_params.append(param_path[1])

            logger.info(
                f"Missing parameters according to validation errors: {missing_params}"
            )

            # Verify expected parameters are mentioned
            expected_params = ["user_id", "access_token", "refresh_token"]
            for param in expected_params:
                assert (
                    param in missing_params
                ), f"Validation errors should mention missing '{param}' parameter"

            logger.info("Missing tokens validation test passed successfully!")
        finally:
            # Clean up the test user
            if user_id:
                self._cleanup_test_user(client, user_id, auth_token)
