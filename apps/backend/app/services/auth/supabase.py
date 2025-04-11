"""Supabase client utilities."""

import logging
from typing import Any, Dict, Optional

from fastapi import status
from supabase import AuthApiError
from supabase._async.client import AsyncClient, create_client
from supabase.lib.client_options import ClientOptions

from ...config import settings

# Create logger
logger = logging.getLogger(__name__)


class SupabaseAuthError(Exception):
    """Custom exception for Supabase authentication errors."""

    def __init__(self, message: str, status_code: int = status.HTTP_401_UNAUTHORIZED):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


async def get_supabase_client() -> AsyncClient:
    """
    Create and return a Supabase client.

    Returns:
        Supabase client instance
    """
    return await create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY,
        options=ClientOptions(auto_refresh_token=True, persist_session=False),
    )


async def get_authenticated_client(
    access_token: str, refresh_token: str
) -> AsyncClient:
    """
    Create a Supabase client using an existing user token.

    Args:
        access_token: User's access token from login
        refresh_token: User's refresh token from login

    Returns:
        Authenticated Supabase client instance
    """
    client = await get_supabase_client()
    await client.auth.set_session(access_token, refresh_token)
    return client


async def get_supabase_admin_client() -> AsyncClient:
    """
    Create and return a Supabase client with admin privileges.

    Returns:
        Supabase client instance with admin privileges
    """
    return await create_client(
        settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
    )


async def signup_user(email: str, password: str) -> Dict[str, Any]:
    """
    Register a new user using Supabase client.

    Args:
        email: User email
        password: User password

    Returns:
        Dict containing session info and user data

    Raises:
        SupabaseAuthError: On authentication failure
    """
    logger.info(f"Signing up user: {email}")
    try:
        client = await get_supabase_client()
        response = await client.auth.sign_up({"email": email, "password": password})

        # Check if registration succeeded
        if not response.user or not response.session:
            raise SupabaseAuthError(
                "User registration failed: No user or session data returned",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(f"Signup successful for: {email}")
        return response.model_dump()
    except SupabaseAuthError as e:
        # Re-raise our custom exceptions
        raise e
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"Signup error for {email}: {error_str}")

        # Handle specific error cases
        if "already registered" in error_str or "already in use" in error_str:
            raise SupabaseAuthError(
                "This email is already registered", status_code=status.HTTP_409_CONFLICT
            )

        # General error
        raise SupabaseAuthError(
            f"Registration failed: {str(e)}", status_code=status.HTTP_400_BAD_REQUEST
        )


async def login_user(email: str, password: str) -> Dict[str, Any]:
    """
    Login a user using Supabase client.

    Args:
        email: User email
        password: User password

    Returns:
        Dict containing session info and user data

    Raises:
        SupabaseAuthError: On authentication failure
    """
    logger.info(f"Logging in user: {email}")
    try:
        client = await get_supabase_client()
        response = await client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

        # Check if login succeeded
        if not response.user or not response.session:
            raise SupabaseAuthError("Invalid email or password")

        logger.info(f"Login successful for: {email}")
        return response.model_dump()
    except SupabaseAuthError as e:
        # Re-raise our custom exceptions
        raise e
    except Exception as e:
        logger.error(f"Login error for {email}: {str(e)}")
        raise SupabaseAuthError("Invalid email or password")


async def reset_password(email: str) -> Dict[str, Any]:
    """
    Request a password reset email through Supabase client.

    Args:
        email: User email

    Returns:
        Success response
    """
    logger.info(f"Requesting password reset for: {email}")
    try:
        redirect_url = f"{settings.FRONTEND_URL}/reset-password"
        logger.info(f"Reset password will redirect to: {redirect_url}")

        client = await get_supabase_client()
        await client.auth.reset_password_for_email(
            email, options={"redirect_to": redirect_url}
        )

        logger.info(f"Password reset email sent to: {email}")
        return {"success": True}
    except Exception as e:
        logger.error(f"Password reset error for {email}: {str(e)}")
        # We don't raise an error here to avoid revealing if an email exists
        return {"success": True}


async def change_password(
    new_password: str, access_token: str, refresh_token: str
) -> Dict[str, Any]:
    """
    Change user password using Supabase client.

    Args:
        new_password: New password
        access_token: User access token
        refresh_token: User refresh token

    Returns:
        Success response

    Raises:
        SupabaseAuthError: On password change failure
    """
    logger.info("Attempting to change password")
    try:
        client = await get_authenticated_client(access_token, refresh_token)
        response = await client.auth.update_user({"password": new_password})

        logger.info("Password updated successfully")
        return {"success": True}
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"Password change error: {error_str}")

        # Check for specific error types
        if "new password should be different from the old password" in error_str:
            raise SupabaseAuthError(
                "New password should be different from your current password",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        elif "invalid" in error_str or "expired" in error_str:
            raise SupabaseAuthError(
                "Your session has expired. Please log in again.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        elif "weak" in error_str or "strength" in error_str:
            raise SupabaseAuthError(
                "Password is too weak. Please use a stronger password with at least 8 characters, including numbers and special characters.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # General error
        raise SupabaseAuthError(
            "Failed to change password. Please try again.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


async def delete_user(user_id: str) -> Dict[str, Any]:
    """
    Delete a user by user ID using Supabase client.

    This function uses the admin API with service role key to delete a user from Supabase.

    Args:
        user_id: The UUID of the user to delete

    Returns:
        Success response

    Raises:
        SupabaseAuthError: If deletion fails
    """
    logger.info(f"Creating admin client with service role key for user deletion")
    try:
        admin_client = await get_supabase_admin_client()

        logger.info(f"Attempting to delete user with ID: {user_id}")
        await admin_client.auth.admin.delete_user(user_id)

        logger.info(f"User {user_id} deleted successfully")
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {str(e)}")
        raise SupabaseAuthError(
            "Failed to delete account. Please try again later.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


async def logout_user(access_token: str, refresh_token: str) -> Dict[str, Any]:
    """
    Logout a user by invalidating their session using Supabase client.

    Args:
        access_token: User's access token to be invalidated
        refresh_token: User's refresh token

    Returns:
        Success response
    """
    logger.info("Attempting to logout user")
    try:
        client = await get_authenticated_client(access_token, refresh_token)
        await client.auth.sign_out()

        logger.info("User logged out successfully")
        return {"success": True}
    except Exception as e:
        # Just log errors, don't raise them - we want logout to succeed even if
        # there's an issue with invalidating the token on the server
        logger.error(f"Logout error: {str(e)}")
        return {"success": True}


async def get_user(access_token: str, refresh_token: str) -> Dict[str, Any]:
    """
    Get the user information using Supabase client, attempting refresh if needed.

    Args:
        access_token: User's access token
        refresh_token: User's refresh token

    Returns:
        User data

    Raises:
        SupabaseAuthError: If fetching user fails even after potential refresh
    """
    logger.info("Attempting to fetch user information...")
    client: Optional[AsyncClient] = None  # Initialize client to None

    try:
        client = await get_authenticated_client(access_token, refresh_token)
        response = await client.auth.get_user()

        # Check if we got a valid user directly
        if response.user:
            logger.info("User information retrieved successfully with initial token.")
            return response.model_dump()
        else:
            # If no user but no immediate error, maybe token expired silently? Try refresh.
            logger.warning(
                "Initial get_user call returned no user, attempting session refresh."
            )
            # Fall through to refresh logic, or raise specific error if appropriate
            # Based on Supabase client behavior, an error might be raised below instead.

    except Exception as e:
        error_str = str(e).lower()
        logger.warning(
            f"Initial get_user failed: {error_str}. Checking if refresh is possible."
        )

        # Check if the error indicates an expired access token and refresh is possible
        # Note: Exact error message/type might vary depending on Supabase client version.
        # Adjust the condition based on actual errors observed.
        is_expired_error = (
            "invalid token" in error_str
            or "jwt expired" in error_str
            or isinstance(e, AuthApiError)
            and e.status == 401
        )  # Example check

        if is_expired_error and refresh_token and client:
            logger.info("Access token likely expired, attempting refresh...")
            try:
                # Use the same client instance which should have the refresh token set
                refresh_response = await client.auth.refresh_session()
                if refresh_response.user and refresh_response.session:
                    logger.info("Session refreshed successfully. Re-fetching user.")
                    # Retry getting the user with the refreshed session
                    # The client session is updated internally by refresh_session()
                    response_after_refresh = await client.auth.get_user()
                    if response_after_refresh.user:
                        logger.info("User retrieved successfully after refresh.")
                        # Return the model dump of the UserResponse object
                        return response_after_refresh.model_dump()
                    else:
                        logger.error(
                            "Failed to retrieve user even after successful refresh."
                        )
                        raise SupabaseAuthError(
                            "Failed to retrieve user after session refresh",
                            status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )
                else:
                    logger.warning(
                        "Session refresh attempt did not return valid user/session."
                    )
                    raise SupabaseAuthError(
                        "Session refresh failed", status.HTTP_401_UNAUTHORIZED
                    )

            except Exception as refresh_err:
                logger.error(f"Session refresh failed: {str(refresh_err)}")
                # If refresh fails, raise the appropriate error
                raise SupabaseAuthError(
                    "Your session has expired or is invalid. Please log in again.",
                    status.HTTP_401_UNAUTHORIZED,
                )
        else:
            # If the error wasn't an expiration error, or no refresh token, or no client, re-raise
            logger.error(
                f"Unhandled error fetching user data or refresh not possible: {error_str}"
            )
            raise SupabaseAuthError(
                "Failed to authenticate user", status.HTTP_401_UNAUTHORIZED
            )

    # Fallback if initial get_user returned no user and no exception was caught
    # This path might indicate an issue with the Supabase client or unexpected response
    logger.error(
        "get_user finished without returning user data or raising a definitive error."
    )
    raise SupabaseAuthError(
        "Failed to retrieve user data", status.HTTP_500_INTERNAL_SERVER_ERROR
    )
