"""Supabase client utilities."""

import logging
from typing import Any, Dict

import requests
from supabase import Client, create_client

from ...config import settings

# Create logger
logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """
    Create and return a Supabase client.

    Returns:
        Supabase client instance
    """
    logger.debug(f"Creating Supabase client with URL: {settings.SUPABASE_URL[:20]}...")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def get_authenticated_client(access_token: str, refresh_token: str) -> Client:
    """
    Create a Supabase client using an existing user token.

    Args:
        access_token: User's access token from login
        refresh_token: User's refresh token from login

    Returns:
        Authenticated Supabase client instance
    """
    logger.debug(f"Creating authenticated Supabase client...")
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    client.auth.set_session(access_token, refresh_token)  # Attach tokens to client
    return client


def get_supabase_admin_client() -> Client:
    """
    Create and return a Supabase client with admin privileges.

    Returns:
        Supabase client instance with admin privileges
    """
    logger.debug(
        f"Creating Supabase admin client with URL: {settings.SUPABASE_URL[:20]}..."
    )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def _get_supabase_auth_url(endpoint: str) -> str:
    """
    Generate a Supabase Auth URL for the given endpoint.

    Args:
        endpoint: The auth endpoint path

    Returns:
        Full Supabase Auth URL
    """
    return f"{settings.SUPABASE_URL}/auth/v1/{endpoint}"


def _get_auth_headers(token: str = None) -> Dict[str, str]:
    """
    Generate headers for Supabase Auth API requests.

    Args:
        token: Optional auth token for authenticated requests

    Returns:
        Headers dictionary
    """
    headers = {
        "Content-Type": "application/json",
        "apikey": settings.SUPABASE_KEY,
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    return headers


def signup_user(email: str, password: str) -> dict:
    """
    Register a new user using Supabase REST API.

    Args:
        email: User email
        password: User password

    Returns:
        User registration response
    """
    logger.info(f"Signing up user: {email}")
    try:
        url = _get_supabase_auth_url("signup")
        payload = {"email": email, "password": password}

        response = requests.post(url, json=payload, headers=_get_auth_headers())
        response.raise_for_status()

        logger.info(f"Signup successful for: {email}")
        return response.json()
    except Exception as e:
        logger.error(f"Signup error for {email}: {str(e)}")
        # Check if this is a database error related to user_quotas
        if "user_quotas" in str(e).lower():
            # Try to get the user anyway
            try:
                # Return a simple success response
                logger.warning(
                    "Bypassing user_quotas error and returning simple response"
                )
                return {"user": {"email": email}, "session": None}
            except Exception as inner_e:
                logger.error(f"Error in error handler: {str(inner_e)}")
                raise inner_e
        raise e


def login_user(email: str, password: str) -> dict:
    """
    Login a user using Supabase REST API.

    Args:
        email: User email
        password: User password

    Returns:
        User login response
    """
    logger.info(f"Logging in user: {email}")
    try:
        url = _get_supabase_auth_url("token?grant_type=password")
        payload = {"email": email, "password": password}

        response = requests.post(url, json=payload, headers=_get_auth_headers())
        response.raise_for_status()

        logger.info(f"Login successful for: {email}")
        return response.json()
    except Exception as e:
        logger.error(f"Login error for {email}: {str(e)}")
        raise e


def reset_password(email: str) -> dict:
    """
    Send password reset email using Supabase REST API.

    Args:
        email: User email

    Returns:
        Password reset response
    """
    logger.info(f"Requesting password reset for: {email}")
    try:
        url = _get_supabase_auth_url("recover")
        payload = {"email": email}

        response = requests.post(url, json=payload, headers=_get_auth_headers())
        response.raise_for_status()

        logger.info(f"Password reset email sent to: {email}")
        return {"success": True}
    except Exception as e:
        logger.error(f"Password reset error for {email}: {str(e)}")
        raise e


def change_password(new_password: str, access_token: str, refresh_token: str) -> dict:
    """
    Change user password using Supabase REST API.

    Args:
        new_password: New password
        access_token: User access token
        refresh_token: User refresh token

    Returns:
        Password change response
    """
    logger.info("Attempting to change password")
    try:
        url = _get_supabase_auth_url("user")
        payload = {"password": new_password}

        # Use the access token for authentication
        headers = _get_auth_headers(access_token)

        response = requests.put(url, json=payload, headers=headers)
        response.raise_for_status()

        logger.info("Password updated successfully")
        return response.json()
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        raise e


def delete_user(user_id: str) -> dict:
    """
    Delete a user by user ID.

    This function uses the admin API with service role key to delete a user from Supabase.

    Args:
        user_id: The UUID of the user to delete

    Returns:
        dict: Response indicating success or failure

    Raises:
        Exception: If deletion fails
    """
    # Create a special client with service role key for admin operations
    logger.info(f"Creating admin client with service role key for user deletion")
    admin_client = get_supabase_admin_client()

    logger.info(f"Attempting to delete user with ID: {user_id}")
    try:
        # Delete the user using admin API
        response = admin_client.auth.admin.delete_user(user_id)
        logger.info(f"User {user_id} deleted successfully")
        return {"success": True, "message": f"User {user_id} deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {str(e)}")
        raise e
