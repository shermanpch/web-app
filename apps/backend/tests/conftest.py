"""Test configuration and fixtures for pytest."""

import logging
import os
import sys
from collections.abc import Generator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from httpx import Response

from main import app

# Create logs directory if it doesn't exist
log_dir = Path(__file__).parent.parent / "logs"
log_dir.mkdir(exist_ok=True)

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

# Create test logger with module name
logger = logging.getLogger(__name__)

# Add file handler to the test logger
file_handler = logging.FileHandler(log_dir / "test_run.log")
file_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)
logger.addHandler(file_handler)

# Set test logger level
logger.setLevel(logging.INFO)


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """
    Create a test client for FastAPI application.

    Returns:
        TestClient: FastAPI test client
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def test_user() -> Generator[dict[str, str], None, None]:
    """
    Test user credentials.

    Returns:
        dict: Test user credentials
    """
    random_id = os.urandom(4).hex()
    yield {
        "email": f"testuser.{random_id}@example.com",
        "password": "TestPassword123!",
    }


@pytest.fixture(scope="function")
def auth_tokens(
    client: TestClient, test_user: dict[str, str]
) -> Generator[dict[str, Any], None, None]:
    """
    Get both access and refresh tokens for a test user.
    Automatically handles user creation and cleanup.

    Args:
        client: FastAPI test client
        test_user: Test user credentials

    Yields:
        dict: Dictionary containing 'access_token', 'refresh_token', and 'user_id'
    """
    # Register the user
    signup_response = client.post("/api/auth/signup", json=test_user)

    user_id = None
    if signup_response.status_code == 200:
        user_data = signup_response.json().get("data", {})
        user = user_data.get("user", {})
        user_id = user.get("id")
        logger.info(f"Created test user with ID: {user_id}")

    # Login to get tokens
    login_response = client.post("/api/auth/login", json=test_user)
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"

    # Extract tokens from cookies
    cookies = login_response.cookies
    access_token = cookies.get("auth_token")
    refresh_token = cookies.get("refresh_token")

    logger.info(
        f"Got access token from cookies: {access_token[:10] if access_token else 'None'}..."
    )
    logger.info(
        f"Got refresh token from cookies: {refresh_token[:10] if refresh_token else 'None'}..."
    )

    assert access_token, "Failed to extract access token from cookies"
    assert refresh_token, "Failed to extract refresh token from cookies"

    # Store tokens and user_id
    auth_data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": user_id,
    }

    # Yield the tokens and user_id for the test to use
    yield auth_data

    # Cleanup after the test is done
    if user_id:
        # Set cookies on the client instance for authentication
        client.cookies.set("auth_token", access_token)
        client.cookies.set("refresh_token", refresh_token)

        # Delete the user
        delete_response = client.delete(f"/api/auth/users/{user_id}")
        logger.info(
            f"Cleanup: Deleted user {user_id}, status: {delete_response.status_code}"
        )


@pytest.fixture(scope="function")
def authenticated_client(
    client: TestClient, auth_tokens: dict[str, Any]
) -> Generator[tuple[TestClient, str | None], None, None]:
    """
    Provides a pre-authenticated TestClient instance.

    This fixture handles setting up authentication cookies automatically,
    eliminating the need for manual cookie configuration in tests.

    Args:
        client: FastAPI test client
        auth_tokens: Authentication tokens and user ID

    Yields:
        tuple: (TestClient, str) - The authenticated client and the user_id
    """
    # Set the authentication cookies on the client
    client.cookies.set("auth_token", auth_tokens["access_token"])
    client.cookies.set("refresh_token", auth_tokens["refresh_token"])

    # Yield the authenticated client and user_id as a tuple
    yield client, auth_tokens["user_id"]

    # Make sure to clear cookies after use
    client.cookies.clear()


@pytest.fixture(scope="function")
def reset_password_user() -> Generator[dict[str, str], None, None]:
    """
    User credentials for reset password test.

    Returns:
        dict: User credentials with specific email
    """
    from app.config import settings

    yield {"email": settings.TEST_EMAIL, "password": "TestPassword123!"}


# Assertion helper functions
def assert_successful_response(
    response: Response, status_code: int = 200
) -> dict[str, Any]:
    """
    Assert that a response was successful with expected status code.

    Args:
        response: HTTP response
        status_code: Expected status code (default: 200)

    Returns:
        dict: Response data as JSON
    """
    assert response.status_code == status_code, (
        f"Expected status code {status_code}, got {response.status_code}: {response.text}"
    )

    data: dict[str, Any] = response.json()
    if isinstance(data, dict) and "status" in data:
        assert data.get("status") == "success", (
            f"Expected 'success' status, got: {data.get('status')}"
        )

    return data


def assert_has_fields(obj: dict[str, Any], fields: list[str], prefix: str = "") -> None:
    """
    Assert that an object has all the specified fields.

    Args:
        obj: Object to check
        fields: List of field names to check for
        prefix: Prefix for error messages
    """
    for field in fields:
        assert field in obj, f"{prefix}Missing required field: {field}"


def extract_tokens_from_cookies(response: Response) -> dict[str, str]:
    """
    Extract authentication tokens from response cookies.

    Args:
        response: HTTP response with cookies

    Returns:
        dict: Dictionary containing access and refresh tokens
    """
    cookies = response.cookies
    access_token = cookies.get("auth_token")
    refresh_token = cookies.get("refresh_token")

    assert access_token, "Failed to extract access token from cookies"
    assert refresh_token, "Failed to extract refresh token from cookies"

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


def extract_user_data(response: Response) -> dict[str, Any]:
    """
    Extract user data from response.

    Args:
        response: HTTP response containing user data

    Returns:
        dict: User data
    """
    data = response.json()
    if isinstance(data, dict) and "data" in data:
        data = data["data"]
    if isinstance(data, dict) and "user" in data:
        data = data["user"]
    return data
