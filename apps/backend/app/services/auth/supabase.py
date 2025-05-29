"""Supabase client utilities."""

import logging
from typing import Any

from fastapi import status
from supabase import AuthApiError
from supabase._async.client import AsyncClient, create_client
from supabase.lib.client_options import ClientOptions

from ...config import settings


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


async def signup_user(email: str, password: str) -> dict[str, Any]:
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
    try:
        client = await get_supabase_client()
        redirect_url = f"{settings.FRONTEND_URL}/auth/confirmed"
        response = await client.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {"email_redirect_to": redirect_url},
            }
        )

        if not response.user:  # User object is essential
            raise SupabaseAuthError(
                "User registration failed: No user data returned",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # If response.session is None, it typically means email confirmation is pending.
        # The user object (response.user) will contain details like email_confirmed_at = None.
        return response.model_dump()
    except SupabaseAuthError:
        raise
    except Exception as e:
        error_str = str(e).lower()
        if "already registered" in error_str or "already in use" in error_str:
            raise SupabaseAuthError(
                "This email is already registered", status_code=status.HTTP_409_CONFLICT
            )
        raise SupabaseAuthError(
            f"Registration failed: {str(e)}", status_code=status.HTTP_400_BAD_REQUEST
        )


async def login_user(email: str, password: str) -> dict[str, Any]:
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
    try:
        client = await get_supabase_client()
        response = await client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

        if not response.user or not response.session:
            raise SupabaseAuthError("Invalid email or password")

        return response.model_dump()
    except AuthApiError as e:  # Ensure AuthApiError is correctly imported
        if "email not confirmed" in str(e.message).lower():
            raise SupabaseAuthError(
                "Email not confirmed. Please check your inbox.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        raise SupabaseAuthError("Invalid email or password")
    except SupabaseAuthError:
        raise
    except Exception:
        raise SupabaseAuthError("Invalid email or password")


async def reset_password(email: str) -> dict[str, Any]:
    """
    Request a password reset email through Supabase client.

    Args:
        email: User email

    Returns:
        Success response
    """
    try:
        redirect_url = f"{settings.FRONTEND_URL}/reset-password"
        client = await get_supabase_client()
        await client.auth.reset_password_for_email(
            email, options={"redirect_to": redirect_url}
        )
        return {"success": True}
    except Exception:
        # Don't raise error to avoid revealing if email exists
        return {"success": True}


async def change_password(
    new_password: str, access_token: str, refresh_token: str
) -> dict[str, Any]:
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
    try:
        client = await get_authenticated_client(access_token, refresh_token)
        await client.auth.update_user({"password": new_password})
        return {"success": True}
    except Exception as e:
        error_str = str(e).lower()
        if "new password should be different from the old password" in error_str:
            raise SupabaseAuthError(
                "New password should be different from your current password",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if "invalid" in error_str or "expired" in error_str:
            raise SupabaseAuthError(
                "Your session has expired. Please log in again.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        if "weak" in error_str or "strength" in error_str:
            raise SupabaseAuthError(
                "Password is too weak. Please use a stronger password with at least 8 characters, including numbers and special characters.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        raise SupabaseAuthError(
            "Failed to change password. Please try again.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


async def delete_user(user_id: str) -> dict[str, Any]:
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
    try:
        admin_client = await get_supabase_admin_client()
        await admin_client.auth.admin.delete_user(user_id)
        return {"success": True}
    except Exception:
        raise SupabaseAuthError(
            "Failed to delete account. Please try again later.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


async def logout_user(access_token: str, refresh_token: str) -> dict[str, Any]:
    """
    Logout a user by invalidating their session using Supabase client.

    Args:
        access_token: User's access token to be invalidated
        refresh_token: User's refresh token

    Returns:
        Success response
    """
    try:
        client = await get_authenticated_client(access_token, refresh_token)
        await client.auth.sign_out()
        return {"success": True}
    except Exception:
        # Return success even if token invalidation fails
        return {"success": True}


async def get_user(access_token: str, refresh_token: str) -> dict[str, Any]:
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
    try:
        client = await get_authenticated_client(access_token, refresh_token)
        response = await client.auth.get_user()

        if response.user:
            return response.model_dump()

        # No user returned but no error thrown - try refresh
        refresh_response = await client.auth.refresh_session()

        if not refresh_response.user or not refresh_response.session:
            raise SupabaseAuthError(
                "Session refresh failed", status.HTTP_401_UNAUTHORIZED
            )

        # Retry with refreshed session
        final_response = await client.auth.get_user()
        if not final_response.user:
            raise SupabaseAuthError(
                "Failed to retrieve user after session refresh",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return final_response.model_dump()

    except Exception as e:
        error_str = str(e).lower()
        is_expired = (
            "invalid token" in error_str
            or "jwt expired" in error_str
            or isinstance(e, AuthApiError)
            and e.status == 401
        )

        if is_expired:
            raise SupabaseAuthError(
                "Your session has expired. Please log in again.",
                status.HTTP_401_UNAUTHORIZED,
            )

        raise SupabaseAuthError(
            "Failed to authenticate user", status.HTTP_401_UNAUTHORIZED
        )


async def resend_confirmation_email(email: str) -> dict[str, Any]:
    """
    Resend confirmation email for a user.

    Args:
        email: User email

    Returns:
        Success response

    Raises:
        SupabaseAuthError: If resending fails
    """
    try:
        client = await get_supabase_client()
        redirect_url = f"{settings.FRONTEND_URL}/auth/confirmed"
        await client.auth.resend(
            {
                "email": email,
                "type": "signup",
                "options": {"email_redirect_to": redirect_url},
            }
        )
        return {"success": True}
    except Exception as e:
        # Return success to avoid email enumeration, but log the error
        logger.error(f"Failed to resend confirmation email for {email}: {str(e)}")
        return {"success": True}
