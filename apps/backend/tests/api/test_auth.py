"""Tests for authentication endpoints."""

import logging

import pytest
from fastapi import status
from tests.api.base_test import BaseTest
from tests.conftest import assert_has_fields, assert_successful_response

# Get the logger with module name
logger = logging.getLogger(__name__)


class TestAuthentication(BaseTest):
    """Test suite for authentication endpoints."""

    def test_signup(self, client, test_user, user_cleanup):
        """Test user signup."""
        # ARRANGE
        self.logger.info("Testing user signup")

        # ACT
        response = client.post("/api/auth/signup", json=test_user)

        # ASSERT
        data = assert_successful_response(response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["user"])

        # Get user_id for cleanup
        user_data = self._extract_user_data(response)
        user_id = user_data.get("id")

        # CLEANUP - Get token for deletion
        if user_id:
            login_response = client.post("/api/auth/login", json=test_user)
            if login_response.status_code == 200:
                tokens = self._extract_tokens(login_response)
                user_cleanup(client, user_id, tokens["access_token"])

    def test_login(self, client, test_user, user_cleanup):
        """Test user login."""
        # ARRANGE
        self.logger.info("Testing user login")

        # First sign up the user
        signup_response = client.post("/api/auth/signup", json=test_user)
        user_data = self._extract_user_data(signup_response)
        user_id = user_data.get("id")

        # ACT
        response = client.post("/api/auth/login", json=test_user)

        # ASSERT
        data = assert_successful_response(response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["session"])
        assert_has_fields(data["data"]["session"], ["access_token", "refresh_token"])

        # CLEANUP
        if user_id:
            tokens = self._extract_tokens(response)
            user_cleanup(client, user_id, tokens["access_token"])

    def test_get_current_user(self, client, auth_headers, user_cleanup):
        """Test getting current user info."""
        # ARRANGE
        self.logger.info("Testing get current user")

        # ACT
        response = client.get("/api/auth/me", headers=auth_headers)

        # ASSERT
        assert response.status_code == status.HTTP_200_OK
        user_data = response.json()
        assert_has_fields(user_data, ["id", "email"])

        # CLEANUP
        user_id = user_data["id"]
        auth_token = self._extract_auth_token(auth_headers)
        user_cleanup(client, user_id, auth_token)

    def test_refresh_token(
        self, client, auth_headers, auth_tokens, test_user, user_cleanup
    ):
        """Test refreshing token."""
        # ARRANGE
        self.logger.info("Testing token refresh")
        user_id = self._get_user_id(client, auth_headers)

        # Get refresh token directly from auth_tokens fixture
        refresh_token = auth_tokens["refresh_token"]

        # ACT
        response = client.post(
            "/api/auth/refresh", json={"refresh_token": refresh_token}
        )

        # ASSERT
        data = assert_successful_response(response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["session"])
        assert_has_fields(data["data"]["session"], ["access_token", "refresh_token"])

        # CLEANUP
        auth_token = self._extract_auth_token(auth_headers)
        user_cleanup(client, user_id, auth_token)

    def test_reset_password(self, client, reset_password_user, user_cleanup):
        """Test password reset request using specific email."""
        # ARRANGE
        self.logger.info("Testing password reset")

        # Sign up the user
        signup_response = client.post("/api/auth/signup", json=reset_password_user)
        user_data = self._extract_user_data(signup_response)
        user_id = user_data.get("id")

        # ACT
        response = client.post(
            "/api/auth/password/reset", json={"email": reset_password_user["email"]}
        )

        # ASSERT
        data = assert_successful_response(response)
        assert "message" in data

        # CLEANUP
        if user_id:
            login_response = client.post("/api/auth/login", json=reset_password_user)
            if login_response.status_code == 200:
                tokens = self._extract_tokens(login_response)
                user_cleanup(client, user_id, tokens["access_token"])

    def test_password_change_flow(self, client, test_user, user_cleanup):
        """Test the entire password change flow."""
        # ARRANGE
        self.logger.info("Testing password change flow")

        # Create user and get token
        signup_response = client.post("/api/auth/signup", json=test_user)
        user_data = self._extract_user_data(signup_response)
        user_id = user_data.get("id")

        login_response = client.post("/api/auth/login", json=test_user)
        tokens = self._extract_tokens(login_response)
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Skip test if no refresh token found
        if not refresh_token:
            pytest.skip("No refresh token found in response - test cannot continue")

        # ACT - Change password
        new_password = "NewPassword456!"
        change_request = {
            "password": new_password,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

        change_response = client.post("/api/auth/password/change", json=change_request)

        # ASSERT - Password change successful
        assert_successful_response(change_response)

        # Verify: Login with new password
        new_credentials = {"email": test_user["email"], "password": new_password}
        new_login_response = client.post("/api/auth/login", json=new_credentials)

        # ASSERT - Login with new password successful
        data = assert_successful_response(new_login_response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["session"])
        assert_has_fields(data["data"]["session"], ["access_token"])

        # CLEANUP
        if user_id:
            new_tokens = self._extract_tokens(new_login_response)
            user_cleanup(client, user_id, new_tokens["access_token"])

    def test_unauthorized_access(self, client):
        """Test access to protected endpoint without authentication."""
        # ARRANGE & ACT
        self.logger.info("Testing unauthorized access")
        response = client.get("/api/auth/me")

        # ASSERT
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_invalid_credentials_login(self, client):
        """Test login with invalid credentials."""
        # ARRANGE & ACT
        self.logger.info("Testing invalid credentials")
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "WrongPassword123!"},
        )

        # ASSERT
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_real_user_deletion(self, client, test_user):
        """Test actual user creation and deletion (integration test)."""
        # ARRANGE
        self.logger.info("Testing user deletion")

        # Sign up the user
        signup_response = client.post("/api/auth/signup", json=test_user)
        assert (
            signup_response.status_code == 200
        ), f"Failed to create user: {signup_response.text}"

        # Get user ID from response
        user_data = self._extract_user_data(signup_response)
        user_id = user_data.get("id")

        # Login to get the token
        login_response = client.post("/api/auth/login", json=test_user)
        assert (
            login_response.status_code == 200
        ), f"Failed to login: {login_response.text}"

        # Get token
        tokens = self._extract_tokens(login_response)
        access_token = tokens["access_token"]

        # ACT - Delete the user
        headers = {"Authorization": f"Bearer {access_token}"}
        delete_response = client.delete(f"/api/auth/users/{user_id}", headers=headers)

        # ASSERT - Deletion successful
        data = assert_successful_response(delete_response)

        # Verify user is gone by trying to login
        verify_login = client.post("/api/auth/login", json=test_user)
        assert verify_login.status_code == 401, "User should no longer exist"

    def test_verify_password_reset_token(
        self, client, reset_password_user, mocker, user_cleanup
    ):
        """Test password reset token verification."""
        # ARRANGE
        self.logger.info("Testing password reset token verification")

        # Sign up the user
        signup_response = client.post("/api/auth/signup", json=reset_password_user)
        user_data = self._extract_user_data(signup_response)
        user_id = user_data.get("id")

        # Mock the verify_password_reset_token function since
        # we can't actually get the real token from auth
        mock_verify = mocker.patch(
            "app.api.endpoints.auth.verify_password_reset_token", return_value=None
        )

        # ACT
        test_token = "test_verification_token_123"
        response = client.post(
            "/api/auth/password/reset/verify",
            json={"email": reset_password_user["email"], "token": test_token},
        )

        # ASSERT
        data = assert_successful_response(response)
        assert "message" in data
        assert "valid" in data["message"].lower()

        # Verify our mock was called with correct parameters
        mock_verify.assert_called_once_with(reset_password_user["email"], test_token)

        # CLEANUP
        if user_id:
            login_response = client.post("/api/auth/login", json=reset_password_user)
            if login_response.status_code == 200:
                tokens = self._extract_tokens(login_response)
                user_cleanup(client, user_id, tokens["access_token"])
