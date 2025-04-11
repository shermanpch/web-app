"""Tests for authentication endpoints."""

import logging
from typing import Any, Dict, Optional, Tuple

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from tests.api.base_test import BaseTest
from tests.conftest import (
    assert_has_fields,
    assert_successful_response,
    extract_tokens_from_cookies,
    extract_user_data,
)

# Get the logger with module name
logger = logging.getLogger(__name__)


class TestAuthentication(BaseTest):
    """Test suite for authentication endpoints."""

    def test_signup(self, client: TestClient, test_user: Dict[str, str]) -> None:
        """Test user signup."""
        # ARRANGE
        self.logger.info("Testing user signup")

        # ACT
        response = client.post("/api/auth/signup", json=test_user)

        # ASSERT
        data: Dict[str, Any] = assert_successful_response(response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["user"])

        # Check for cookies in response
        assert "Set-Cookie" in response.headers, "Response should set cookies"
        cookies = response.cookies
        assert "auth_token" in cookies, "Response should set auth_token cookie"
        assert "refresh_token" in cookies, "Response should set refresh_token cookie"

        # Verify user data
        user_data: Dict[str, Any] = extract_user_data(response)
        assert user_data.get("id"), "Response should include user ID"
        assert (
            user_data.get("email") == test_user["email"]
        ), "Email should match test user"

        # Set cookies for cleanup
        client.cookies.set("auth_token", cookies.get("auth_token"))
        client.cookies.set("refresh_token", cookies.get("refresh_token"))

        # Cleanup - delete the user we created for this test
        user_id = user_data.get("id")
        if user_id:
            delete_response = client.delete(f"/api/auth/users/{user_id}")
            self.logger.info(
                f"Deleted test user with status: {delete_response.status_code}"
            )

    def test_login(self, client: TestClient, test_user: Dict[str, str]) -> None:
        """Test user login."""
        # ARRANGE
        self.logger.info("Testing user login")

        # Just use a different test_user instance for this specific test
        new_test_user: Dict[str, str] = {
            "email": f"login_test_{test_user['email']}",
            "password": test_user["password"],
        }

        # Create a user specifically for this test
        signup_response = client.post("/api/auth/signup", json=new_test_user)
        assert (
            signup_response.status_code == 200
        ), "Failed to create test user for login test"

        # ACT - Login with the user we just created
        response = client.post("/api/auth/login", json=new_test_user)

        # ASSERT
        data: Dict[str, Any] = assert_successful_response(response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["user"])

        # Check for cookies in response
        assert "Set-Cookie" in response.headers, "Response should set cookies"
        cookies = response.cookies
        assert "auth_token" in cookies, "Response should set auth_token cookie"
        assert "refresh_token" in cookies, "Response should set refresh_token cookie"

        # Set cookies for cleanup
        client.cookies.set("auth_token", cookies.get("auth_token"))
        client.cookies.set("refresh_token", cookies.get("refresh_token"))

        # Cleanup - delete the user we created for this test
        user_data: Dict[str, Any] = extract_user_data(signup_response)
        user_id = user_data.get("id")
        if user_id:
            delete_response = client.delete(f"/api/auth/users/{user_id}")
            self.logger.info(
                f"Deleted test user with status: {delete_response.status_code}"
            )

    def test_get_current_user(
        self, authenticated_client: Tuple[TestClient, Optional[str]]
    ) -> None:
        """Test getting current user info."""
        # ARRANGE
        self.logger.info("Testing get current user")
        client, user_id = authenticated_client

        # ACT
        response = client.get("/api/auth/me")

        # ASSERT
        assert response.status_code == status.HTTP_200_OK
        user_data: Dict[str, Any] = response.json()
        assert_has_fields(user_data, ["id", "email"])

        # Verify the user_id matches what we got from the fixture
        assert (
            user_data["id"] == user_id
        ), "User ID in response doesn't match authenticated user"

    def test_reset_password(
        self, client: TestClient, reset_password_user: Dict[str, str]
    ) -> None:
        """Test password reset request using specific email."""
        # ARRANGE
        self.logger.info("Testing password reset")
        # Just sign up the specific reset password user for this test
        signup_response = client.post("/api/auth/signup", json=reset_password_user)
        user_data: Dict[str, Any] = extract_user_data(signup_response)
        user_id = user_data.get("id")
        assert user_id, "Failed to create reset password test user"

        # ACT
        response = client.post(
            "/api/auth/password/reset", json={"email": reset_password_user["email"]}
        )

        # ASSERT
        data: Dict[str, Any] = assert_successful_response(response)
        assert "message" in data

        # Cleanup - delete the reset password user
        if user_id:
            login_response = client.post("/api/auth/login", json=reset_password_user)
            if login_response.status_code == 200:
                client.cookies.set(
                    "auth_token", login_response.cookies.get("auth_token")
                )
                client.cookies.set(
                    "refresh_token", login_response.cookies.get("refresh_token")
                )
                delete_response = client.delete(f"/api/auth/users/{user_id}")
                self.logger.info(
                    f"Deleted reset password user with status: {delete_response.status_code}"
                )

    def test_password_change_flow(
        self,
        authenticated_client: Tuple[TestClient, Optional[str]],
        test_user: Dict[str, str],
    ) -> None:
        """Test the entire password change flow."""
        # ARRANGE
        self.logger.info("Testing password change flow")
        client, user_id = authenticated_client

        # ACT - Change password
        new_password = "NewPassword456!"
        change_request: Dict[str, str] = {"password": new_password}

        change_response = client.post("/api/auth/password/change", json=change_request)

        # ASSERT - Password change successful
        assert_successful_response(change_response)

        # Verify: Login with new password
        new_credentials: Dict[str, str] = {
            "email": test_user["email"],
            "password": new_password,
        }
        login_response = client.post("/api/auth/login", json=new_credentials)
        assert_successful_response(login_response)

    def test_password_change_same_password(
        self,
        authenticated_client: Tuple[TestClient, Optional[str]],
        test_user: Dict[str, str],
    ) -> None:
        """Test attempting to change password to the same value."""
        # ARRANGE
        self.logger.info("Testing password change with same password")
        client, user_id = authenticated_client

        # ACT - Try to change password to the same value
        change_request: Dict[str, str] = {"password": test_user["password"]}
        response = client.post("/api/auth/password/change", json=change_request)

        # Log the full response for debugging
        self.logger.info(f"Response status code: {response.status_code}")
        self.logger.info(f"Response body: {response.text}")

        # ASSERT
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        self.logger.info(f"Full error response data: {data}")
        assert "detail" in data
        assert (
            data["detail"]
            == "New password should be different from your current password"
        )

    def test_unauthorized_access(self, client: TestClient) -> None:
        """Test access to protected endpoint without authentication."""
        # ARRANGE & ACT
        self.logger.info("Testing unauthorized access")

        # Create a fresh client or clear cookies to ensure no auth is present
        client.cookies.clear()

        response = client.get("/api/auth/me")

        # ASSERT
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_credentials_login(self, client: TestClient) -> None:
        """Test login with invalid credentials."""
        # ARRANGE & ACT
        self.logger.info("Testing invalid credentials")
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "WrongPassword123!"},
        )

        # ASSERT
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio  # type: ignore
    async def test_delete_user_success(
        self,
        client: TestClient,
        test_user: Dict[str, str],
    ) -> None:
        """Test actual user creation and deletion (integration test)."""
        # ARRANGE
        self.logger.info("Testing user deletion")

        # Sign up the user
        signup_response = client.post("/api/auth/signup", json=test_user)
        assert (
            signup_response.status_code == 200
        ), f"Failed to create user: {signup_response.text}"

        # Get user ID from response
        user_data = extract_user_data(signup_response)
        user_id = user_data.get("id")

        # Login to get the token
        login_response = client.post("/api/auth/login", json=test_user)
        assert (
            login_response.status_code == 200
        ), f"Failed to login: {login_response.text}"

        # Get token and set cookies on client instance
        tokens = extract_tokens_from_cookies(login_response)
        client.cookies.set("auth_token", tokens["access_token"])
        client.cookies.set("refresh_token", tokens["refresh_token"])

        # ACT - Delete the user
        delete_response = client.delete(f"/api/auth/users/{user_id}")

        # ASSERT - Deletion successful
        data = assert_successful_response(delete_response)

        # Verify user is gone by trying to login
        verify_login = client.post("/api/auth/login", json=test_user)
        assert verify_login.status_code == 401, "User should no longer exist"

    @pytest.mark.asyncio  # type: ignore
    async def test_login_with_remember_me(
        self,
        client: TestClient,
        test_user: Dict[str, str],
    ) -> None:
        """Test user login with remember_me flag set to True."""
        # ARRANGE
        self.logger.info("Testing user login with remember_me=True")
        new_test_user = {
            "email": f"remember_me_test_{test_user['email']}",
            "password": test_user["password"],
        }

        # Create a user for this test
        signup_response = client.post("/api/auth/signup", json=new_test_user)
        assert signup_response.status_code == 200, "Failed to create test user"

        # ACT - Login with remember_me=True
        login_data = {**new_test_user, "remember_me": True}
        response = client.post("/api/auth/login", json=login_data)

        # ASSERT
        data = assert_successful_response(response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["user"])

        # Check for cookies in response
        assert "Set-Cookie" in response.headers, "Response should set cookies"
        cookies = response.cookies
        assert "auth_token" in cookies, "Response should set auth_token cookie"
        assert "refresh_token" in cookies, "Response should set refresh_token cookie"

        # Get all Set-Cookie headers
        cookie_headers = [
            v for k, v in response.headers.items() if k.lower() == "set-cookie"
        ]
        self.logger.info(f"Cookie headers: {cookie_headers}")

        # Handle case where both cookies are in a single header separated by comma
        all_cookie_parts = []
        for header in cookie_headers:
            # Split by comma, but only if not inside quotes (to handle commas in cookie values)
            parts = header.split(", ")
            all_cookie_parts.extend(parts)

        # Check both cookies for max-age attribute
        auth_cookie = next(
            (c for c in all_cookie_parts if c.startswith("auth_token=")), None
        )
        refresh_cookie = next(
            (c for c in all_cookie_parts if c.startswith("refresh_token=")), None
        )

        assert auth_cookie, "auth_token cookie not found"
        assert refresh_cookie, "refresh_token cookie not found"

        # Verify max-age values
        auth_max_age = next(
            (
                attr.split("=")[1]
                for attr in auth_cookie.split("; ")
                if attr.startswith("Max-Age=")
            ),
            None,
        )
        refresh_max_age = next(
            (
                attr.split("=")[1]
                for attr in refresh_cookie.split("; ")
                if attr.startswith("Max-Age=")
            ),
            None,
        )

        assert auth_max_age, "Max-Age not found in auth_token cookie"
        assert refresh_max_age, "Max-Age not found in refresh_token cookie"

        # Verify the cookies have 30-day expiry (2592000 seconds)
        assert (
            auth_max_age == "2592000"
        ), f"auth_token should have 30-day expiry, got {auth_max_age}"
        assert (
            refresh_max_age == "2592000"
        ), f"refresh_token should have 30-day expiry, got {refresh_max_age}"

        # Set cookies for cleanup
        client.cookies.set("auth_token", cookies.get("auth_token"))
        client.cookies.set("refresh_token", cookies.get("refresh_token"))

        # Cleanup
        user_data = extract_user_data(signup_response)
        user_id = user_data.get("id")
        if user_id:
            delete_response = client.delete(f"/api/auth/users/{user_id}")
            self.logger.info(
                f"Deleted test user with status: {delete_response.status_code}"
            )

    @pytest.mark.asyncio  # type: ignore
    async def test_login_without_remember_me(
        self,
        client: TestClient,
        test_user: Dict[str, str],
    ) -> None:
        """Test user login with remember_me flag set to False."""
        # ARRANGE
        self.logger.info("Testing user login with remember_me=False")
        new_test_user = {
            "email": f"no_remember_test_{test_user['email']}",
            "password": test_user["password"],
        }

        # Create a user for this test
        signup_response = client.post("/api/auth/signup", json=new_test_user)
        assert signup_response.status_code == 200, "Failed to create test user"

        # ACT - Login with remember_me=False
        login_data = {**new_test_user, "remember_me": False}
        response = client.post("/api/auth/login", json=login_data)

        # ASSERT
        data = assert_successful_response(response)
        assert_has_fields(data, ["data"])
        assert_has_fields(data["data"], ["user"])

        # Check for cookies in response
        assert "Set-Cookie" in response.headers, "Response should set cookies"
        cookies = response.cookies
        assert "auth_token" in cookies, "Response should set auth_token cookie"
        assert "refresh_token" in cookies, "Response should set refresh_token cookie"

        # Get all Set-Cookie headers
        cookie_headers = [
            v for k, v in response.headers.items() if k.lower() == "set-cookie"
        ]
        self.logger.info(f"Cookie headers: {cookie_headers}")

        # Handle case where both cookies are in a single header separated by comma
        all_cookie_parts = []
        for header in cookie_headers:
            # Split by comma, but only if not inside quotes (to handle commas in cookie values)
            parts = header.split(", ")
            all_cookie_parts.extend(parts)

        # Check both cookies for max-age attribute
        auth_cookie = next(
            (c for c in all_cookie_parts if c.startswith("auth_token=")), None
        )
        refresh_cookie = next(
            (c for c in all_cookie_parts if c.startswith("refresh_token=")), None
        )

        assert auth_cookie, "auth_token cookie not found"
        assert refresh_cookie, "refresh_token cookie not found"

        # Verify max-age values
        auth_max_age = next(
            (
                attr.split("=")[1]
                for attr in auth_cookie.split("; ")
                if attr.startswith("Max-Age=")
            ),
            None,
        )
        refresh_max_age = next(
            (
                attr.split("=")[1]
                for attr in refresh_cookie.split("; ")
                if attr.startswith("Max-Age=")
            ),
            None,
        )

        assert auth_max_age, "Max-Age not found in auth_token cookie"
        assert refresh_max_age, "Max-Age not found in refresh_token cookie"

        # Verify the cookies have standard expiry
        assert (
            auth_max_age == "3600"
        ), f"auth_token should have 1-hour expiry, got {auth_max_age}"
        assert (
            refresh_max_age == "604800"
        ), f"refresh_token should have 7-day expiry, got {refresh_max_age}"

        # Set cookies for cleanup
        client.cookies.set("auth_token", cookies.get("auth_token"))
        client.cookies.set("refresh_token", cookies.get("refresh_token"))

        # Cleanup
        user_data = extract_user_data(signup_response)
        user_id = user_data.get("id")
        if user_id:
            delete_response = client.delete(f"/api/auth/users/{user_id}")
            self.logger.info(
                f"Deleted test user with status: {delete_response.status_code}"
            )
