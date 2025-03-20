"""Tests for authentication endpoints."""

import logging

import pytest
from fastapi import status

# Get the logger
logger = logging.getLogger("auth_tests")


class TestAuthentication:
    """Test suite for authentication endpoints."""

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

    def test_signup(self, client, test_user):
        """Test user signup."""
        user_id = None
        try:
            response = client.post("/api/auth/signup", json=test_user)

            if response.status_code == 200:
                user_id = response.json()["data"]["user"]["id"]
                logger.info(f"Created test user with ID: {user_id}")

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"
            assert "data" in response.json()
        finally:
            # Clean up the test user
            if user_id:
                # Get login token for deletion
                login_response = client.post("/api/auth/login", json=test_user)
                if login_response.status_code == 200:
                    token = login_response.json()["data"]["session"]["access_token"]
                    self._cleanup_test_user(client, user_id, token)

    def test_login(self, client, test_user):
        """Test user login."""
        user_id = None
        try:
            # First sign up the user
            signup_response = client.post("/api/auth/signup", json=test_user)
            if signup_response.status_code == 200:
                user_id = signup_response.json()["data"]["user"]["id"]
                logger.info(f"Created test user with ID: {user_id}")

            # Then try to log in
            response = client.post("/api/auth/login", json=test_user)

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"
            assert "data" in response.json()
            assert "session" in response.json()["data"]
            assert "access_token" in response.json()["data"]["session"]
        finally:
            # Clean up the test user
            if user_id and response.status_code == 200:
                token = response.json()["data"]["session"]["access_token"]
                self._cleanup_test_user(client, user_id, token)

    def test_get_current_user(self, client, auth_headers):
        """Test getting current user info."""
        response = client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert "id" in response.json()
        assert "email" in response.json()

        # Clean up the user after test
        user_id = response.json()["id"]
        self._cleanup_test_user(
            client, user_id, auth_headers.get("Authorization").split(" ")[1]
        )

    def test_refresh_token(self, client, auth_headers):
        """Test refreshing token."""
        # First get the user ID for cleanup
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json()["id"] if user_response.status_code == 200 else None
        )

        try:
            response = client.post("/api/auth/refresh", headers=auth_headers)

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"
            assert response.json()["message"] == "Token is valid"
        finally:
            # Clean up the user
            if user_id:
                self._cleanup_test_user(
                    client, user_id, auth_headers.get("Authorization").split(" ")[1]
                )

    def test_reset_password(self, client, reset_password_user):
        """Test password reset request using specific email."""
        user_id = None
        try:
            # First sign up the user
            signup_response = client.post("/api/auth/signup", json=reset_password_user)
            if signup_response.status_code == 200:
                user_id = signup_response.json()["data"]["user"]["id"]
                logger.info(f"Created test user with ID: {user_id}")

            # Then request password reset
            response = client.post(
                "/api/auth/reset-password", json={"email": reset_password_user["email"]}
            )

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"
            assert "message" in response.json()
        finally:
            # Clean up the test user
            if user_id:
                # Login to get token for deletion
                login_response = client.post(
                    "/api/auth/login", json=reset_password_user
                )
                if login_response.status_code == 200:
                    token = login_response.json()["data"]["session"]["access_token"]
                    self._cleanup_test_user(client, user_id, token)

    def test_password_change_flow(self, client, test_user):
        """Test the entire password change flow."""
        user_id = None
        token = None
        try:
            # Create user and get token
            signup_response = client.post("/api/auth/signup", json=test_user)
            if signup_response.status_code == 200:
                user_id = signup_response.json()["data"]["user"]["id"]
                logger.info(f"Created test user with ID: {user_id}")

            login_response = client.post("/api/auth/login", json=test_user)
            if login_response.status_code != 200:
                logger.error(f"Login for password change failed: {login_response.text}")

            data = login_response.json()
            token = data["data"]["session"]["access_token"]

            # Try to get refresh token
            try:
                refresh_token = data["data"]["session"].get("refresh_token")
                if not refresh_token:
                    pytest.skip(
                        "No refresh token found in response - test cannot continue"
                    )
            except (KeyError, TypeError):
                pytest.skip("No refresh token found in response - test cannot continue")

            # Test: Change password
            new_password = "NewPassword456!"
            change_request = {
                "password": new_password,
                "access_token": token,
                "refresh_token": refresh_token,
            }

            change_response = client.post(
                "/api/auth/change-password", json=change_request
            )

            assert change_response.status_code == status.HTTP_200_OK
            assert change_response.json()["status"] == "success"

            # Verify: Login with new password
            new_credentials = {"email": test_user["email"], "password": new_password}
            new_login_response = client.post("/api/auth/login", json=new_credentials)

            assert new_login_response.status_code == status.HTTP_200_OK
            assert "access_token" in new_login_response.json()["data"]["session"]

            # Get new token for cleanup
            token = new_login_response.json()["data"]["session"]["access_token"]
        finally:
            # Clean up the test user
            self._cleanup_test_user(client, user_id, token)

    def test_unauthorized_access(self, client):
        """Test access to protected endpoint without authentication."""
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_invalid_credentials_login(self, client):
        """Test login with invalid credentials."""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "WrongPassword123!"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_real_user_deletion(self, client, test_user):
        """Test actual user creation and deletion (integration test)."""
        # Create a new user for testing deletion using the fixture
        signup_data = test_user

        # Sign up the user
        signup_response = client.post("/api/auth/signup", json=signup_data)
        assert (
            signup_response.status_code == 200
        ), f"Failed to create user: {signup_response.text}"

        # Get user ID from response
        user_data = signup_response.json()
        user_id = user_data["data"]["user"]["id"]
        logger.info(f"Created test user with ID: {user_id}")

        # Login to get the token
        login_response = client.post("/api/auth/login", json=signup_data)
        assert (
            login_response.status_code == 200
        ), f"Failed to login: {login_response.text}"

        # Get token
        token_data = login_response.json()
        access_token = token_data["data"]["session"]["access_token"]

        # Delete the user
        headers = {"Authorization": f"Bearer {access_token}"}
        delete_response = client.delete(f"/api/auth/users/{user_id}", headers=headers)

        # Verify deletion was successful
        assert delete_response.status_code == 200
        assert delete_response.json()["status"] == "success"

        # Verify user is gone by trying to login
        verify_login = client.post("/api/auth/login", json=signup_data)
        assert verify_login.status_code == 401, "User should no longer exist"
