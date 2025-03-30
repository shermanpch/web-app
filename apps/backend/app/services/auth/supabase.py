"""Supabase client utilities."""

import logging
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException, status
from supabase._async.client import AsyncClient, create_client
from supabase.lib.client_options import ClientOptions

from ...config import settings
from ...models.auth import SessionInfo, UserData

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


def _extract_session_info(
    response_data: Dict[str, Any],
) -> Tuple[SessionInfo, UserData]:
    """
    Extract session information and user data from Supabase response.

    Args:
        response_data: Response data from Supabase auth operations

    Returns:
        Tuple containing SessionInfo and UserData

    Raises:
        SupabaseAuthError: If required data is missing
    """
    try:
        session_data = response_data.get("session", {})
        user_data = response_data.get("user", {})

        if not session_data or not user_data:
            raise SupabaseAuthError("Invalid authentication response from Supabase")

        session_info = SessionInfo(
            access_token=session_data.get("access_token"),
            refresh_token=session_data.get("refresh_token"),
            expires_in=session_data.get("expires_in", 3600),
        )

        user = UserData(
            id=user_data.get("id"),
            email=user_data.get("email"),
            created_at=user_data.get("created_at"),
            last_sign_in_at=user_data.get("last_sign_in_at"),
        )

        return session_info, user

    except Exception as e:
        logger.error(f"Error extracting session data: {str(e)}")
        raise SupabaseAuthError(f"Error processing authentication data: {str(e)}")


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
        if "same_password" in error_str:
            raise SupabaseAuthError(
                "New password should be different from your current password",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        elif "invalid" in error_str or "expired" in error_str:
            raise SupabaseAuthError(
                "Your session has expired. Please log in again.",
                status_code=status.HTTP_401_UNAUTHORIZED,
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


async def refresh_user_session(refresh_token: str) -> Dict[str, Any]:
    """
    Refresh a user session using Supabase client.

    Args:
        refresh_token: User's refresh token from previous login

    Returns:
        New session data with tokens and user info

    Raises:
        SupabaseAuthError: If session refresh fails
    """
    logger.info("Attempting to refresh user session")
    try:
        client = await get_supabase_client()
        response = await client.auth.refresh_session(refresh_token)

        # Check if refresh succeeded
        if not response.user or not response.session:
            raise SupabaseAuthError("Failed to refresh session")

        logger.info("User session refreshed successfully")
        return response.model_dump()
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"Session refresh error: {error_str}")

        if "expired" in error_str or "invalid" in error_str:
            raise SupabaseAuthError(
                "Your session has expired. Please log in again.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        raise SupabaseAuthError(
            "Failed to refresh session. Please log in again.",
            status_code=status.HTTP_401_UNAUTHORIZED,
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
    Get the user information using Supabase client.

    Args:
        access_token: User's access token
        refresh_token: User's refresh token

    Returns:
        User data

    Raises:
        SupabaseAuthError: If fetching user fails
    """
    logger.info("Fetching user information")
    try:
        client = await get_authenticated_client(access_token, refresh_token)
        response = await client.auth.get_user()

        # Check if we got a valid user
        if not response.user:
            raise SupabaseAuthError("Invalid or expired session")

        logger.info("User information retrieved successfully")
        return response.model_dump()
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"Error fetching user data: {error_str}")

        if "expired" in error_str or "invalid" in error_str:
            raise SupabaseAuthError(
                "Your session has expired. Please log in again.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        raise SupabaseAuthError(
            "Failed to authenticate user", status_code=status.HTTP_401_UNAUTHORIZED
        )
