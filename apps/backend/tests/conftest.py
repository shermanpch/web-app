"""Test configuration and fixtures for pytest."""

import logging
import os
import sys

import pytest
from fastapi.testclient import TestClient

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

# Create logger for tests
logger = logging.getLogger("auth_tests")


@pytest.fixture
def client():
    """
    Create a test client for FastAPI application.

    Returns:
        TestClient: FastAPI test client
    """
    return TestClient(app)


@pytest.fixture
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


@pytest.fixture
def auth_headers(client, test_user):
    """
    Get authentication headers for a test user.

    Args:
        client: FastAPI test client
        test_user: Test user credentials

    Returns:
        dict: Authentication headers
    """
    # Register the user
    signup_response = client.post("/api/auth/signup", json=test_user)
    logger.info(f"Signup response for auth_headers: {signup_response.status_code}")

    user_id = None
    if signup_response.status_code == 200:
        # Extract user ID safely using get() with defaults
        user_data = signup_response.json().get("data", {})
        user = user_data.get("user", {})
        user_id = user.get("id")
        logger.info(f"Created test user with ID: {user_id}")
    else:
        logger.error(f"Signup failed: {signup_response.json()}")

    # Login to get the token
    login_response = client.post("/api/auth/login", json=test_user)
    logger.info(f"Login response for auth_headers: {login_response.status_code}")
    if login_response.status_code != 200:
        logger.error(f"Login failed: {login_response.json()}")

    # Extract token safely using get() with defaults
    data = login_response.json()
    login_data = data.get("data", {})
    session = login_data.get("session", {})
    token = session.get("access_token", "")

    logger.info(f"Got token: {token[:10]}...")

    # Return headers with the token
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def reset_password_user():
    """
    User credentials for reset password test.

    Returns:
        dict: User credentials with specific email
    """
    from src.config import settings

    return {"email": settings.TEST_EMAIL, "password": "TestPassword123!"}
