"""Test configuration and fixtures for pytest."""

import logging
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from main import app

# Create logs directory if it doesn't exist
log_dir = Path("logs")
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
def client():
    """
    Create a test client for FastAPI application.

    Returns:
        TestClient: FastAPI test client
    """
    return TestClient(app)


@pytest.fixture(scope="function")
def test_user():
    """
    Test user credentials.

    Returns:
        dict: Test user credentials
    """
    random_id = os.urandom(4).hex()
    return {
        "email": f"testuser.{random_id}@example.com",
        "password": "TestPassword123!",
    }


@pytest.fixture(scope="function")
def user_cleanup():
    """
    Fixture providing a cleanup function for test users.

    Returns:
        Callable: A function to clean up a test user
    """

    def _cleanup(client, user_id, auth_cookies):
        if user_id and auth_cookies:
            # Set cookies on the client instance
            client.cookies.set("auth_token", auth_cookies["auth_token"])
            client.cookies.set("refresh_token", auth_cookies["refresh_token"])

            delete_response = client.delete(f"/api/auth/users/{user_id}")
            logger.info(
                f"Cleanup: Deleted user {user_id}, status: {delete_response.status_code}"
            )
            return delete_response
        return None

    return _cleanup


@pytest.fixture(scope="function")
def auth_tokens(client, test_user):
    """
    Get both access and refresh tokens for a test user.

    Args:
        client: FastAPI test client
        test_user: Test user credentials

    Returns:
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

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": user_id,
    }


@pytest.fixture(scope="function")
def auth_cookies(auth_tokens):
    """
    Get authentication cookies for a test user, using auth_tokens fixture.

    Args:
        auth_tokens: Dictionary containing auth tokens and user ID

    Returns:
        dict: Authentication cookies with access and refresh tokens
    """
    return {
        "auth_token": auth_tokens["access_token"],
        "refresh_token": auth_tokens["refresh_token"],
    }


@pytest.fixture(scope="function")
def reset_password_user():
    """
    User credentials for reset password test.

    Returns:
        dict: User credentials with specific email
    """
    from app.config import settings

    return {"email": settings.TEST_EMAIL, "password": "TestPassword123!"}


@pytest.fixture(scope="function")
def test_logger(request):
    """
    Set up a logger for each test, using the module name pattern.

    Args:
        request: Pytest request object

    Returns:
        Logger: Logger configured for the current test
    """
    # Create logger name based on module path and test name
    test_name = request.node.name
    logger_name = f"{request.module.__name__}.{test_name}"

    # Get or create logger
    test_logger = logging.getLogger(logger_name)

    # Log test boundaries
    test_logger.info(f"Starting test: {test_name}")
    yield test_logger
    test_logger.info(f"Completed test: {test_name}")


# Assertion helper functions
def assert_successful_response(response, status_code=200):
    """
    Assert that a response was successful with expected status code.

    Args:
        response: HTTP response
        status_code: Expected status code (default: 200)

    Returns:
        dict: Response data as JSON
    """
    assert (
        response.status_code == status_code
    ), f"Expected status code {status_code}, got {response.status_code}: {response.text}"

    data = response.json()
    if isinstance(data, dict) and "status" in data:
        assert (
            data.get("status") == "success"
        ), f"Expected 'success' status, got: {data.get('status')}"

    return data


def assert_has_fields(obj, fields, prefix=""):
    """
    Assert that an object has all the specified fields.

    Args:
        obj: Object to check
        fields: List of field names to check for
        prefix: Prefix for error messages
    """
    for field in fields:
        assert field in obj, f"{prefix}Missing required field: {field}"
