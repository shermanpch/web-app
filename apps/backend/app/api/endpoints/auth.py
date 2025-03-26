"""Authentication API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ...models.auth import (
    AuthResponse,
    PasswordChange,
    PasswordReset,
    RefreshToken,
    UserData,
    UserLogin,
    UserSession,
    UserSessionData,
    UserSessionResponse,
    UserSignup,
)
from ...services.auth.dependencies import get_current_user
from ...services.auth.supabase import (
    change_password,
    delete_user,
    login_user,
    refresh_user_session,
    reset_password,
    signup_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger(__name__)


@router.get("/me", response_model=UserData)
async def get_current_user_info(current_user: UserData = Depends(get_current_user)):
    """
    Get current user information.

    Args:
        current_user: Current authenticated user

    Returns:
        Current user information
    """
    return current_user


@router.post("/refresh", response_model=UserSessionResponse)
async def refresh_session(token: RefreshToken):
    """
    Refresh a user session token.

    Args:
        token: The refresh token

    Returns:
        New session tokens
    """
    try:
        response = await refresh_user_session(token.refresh_token)
        return UserSessionResponse(
            status="success",
            data=UserSessionData(
                user=response.get("user", {}),
                session=UserSession(
                    access_token=response.get("access_token", ""),
                    refresh_token=response.get("refresh_token", ""),
                    expires_in=response.get("expires_in", 3600),
                    token_type=response.get("token_type", "bearer"),
                ),
            ),
        )
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Token refresh error: {str(e)}")

        # Check for common token refresh errors
        error_msg = str(e).lower()
        if "expired" in error_msg or "invalid" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your session has expired. Please log in again.",
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh session. Please log in again.",
        )


@router.post("/signup", response_model=UserSessionResponse)
async def register_user(user: UserSignup):
    """
    Register a new user.

    Args:
        user: User signup data

    Returns:
        User registration response
    """
    try:
        logger.info(f"Attempting to register new user with email: {user.email}")
        response = await signup_user(user.email, user.password)
        session_data = response.get("session", {})
        logger.info(f"Successfully registered new user with email: {user.email}")

        return UserSessionResponse(
            status="success",
            data=UserSessionData(
                user=response.get("user", {}),
                session=UserSession(
                    access_token=session_data.get("access_token", ""),
                    refresh_token=session_data.get("refresh_token", ""),
                    expires_in=session_data.get("expires_in", 3600),
                    token_type=session_data.get("token_type", "bearer"),
                ),
            ),
        )
    except Exception as e:
        error_str = str(e)

        # Log the actual error for debugging
        logger.error(f"Signup error for {user.email}: {error_str}")

        # Determine the appropriate error message based on the exception
        if (
            "already registered" in error_str.lower()
            or "already exists" in error_str.lower()
        ):
            error_message = "This email is already registered"
            error_code = status.HTTP_409_CONFLICT
        elif "password" in error_str.lower():
            error_message = "Password does not meet requirements"
            error_code = status.HTTP_400_BAD_REQUEST
        else:
            error_message = "Failed to create account"
            error_code = status.HTTP_400_BAD_REQUEST

        raise HTTPException(status_code=error_code, detail=error_message)


@router.post("/login", response_model=UserSessionResponse)
async def login(user: UserLogin):
    """
    Login a user.

    Args:
        user: User login data

    Returns:
        User login response with access token
    """
    try:
        logger.info(f"Login attempt for user: {user.email}")
        response = await login_user(user.email, user.password)
        logger.info(f"Successful login for user: {user.email}")
        return UserSessionResponse(
            status="success",
            data=UserSessionData(
                user=response.get("user", {}),
                session=UserSession(
                    access_token=response.get("access_token", ""),
                    refresh_token=response.get("refresh_token", ""),
                    expires_in=response.get("expires_in", 3600),
                    token_type=response.get("token_type", "bearer"),
                ),
            ),
        )
    except Exception as e:
        error_str = str(e)
        error_message = "Invalid email or password"

        # Log the actual error for debugging but don't expose it to clients
        logger.error(f"Login error for {user.email}: {error_str}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_message,
        )


@router.post("/password/reset", response_model=AuthResponse)
async def request_password_reset(data: PasswordReset):
    """
    Request password reset email.

    Args:
        data: Password reset data

    Returns:
        Password reset response
    """
    try:
        logger.info(f"Password reset requested for email: {data.email}")
        await reset_password(data.email)
        logger.info(f"Password reset email sent for: {data.email}")
        return AuthResponse(status="success", message="Password reset email sent")
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Password reset error for {data.email}: {str(e)}")

        # For security reasons, always return a generic success message
        # This prevents email enumeration attacks
        return AuthResponse(
            status="success",
            message="If an account with that email exists, a password reset link has been sent",
        )


@router.post("/password/change", response_model=AuthResponse)
async def update_password(data: PasswordChange):
    """
    Change user password.

    Args:
        data: Password change data (password and access_token)

    Returns:
        Password change response
    """
    try:
        logger.info("Password change attempt")
        await change_password(data.password, data.access_token)
        logger.info("Password updated successfully")
        return AuthResponse(status="success", message="Password updated successfully")
    except Exception as e:
        error_str = str(e)

        # Log the actual error for debugging
        logger.error(f"Password change error: {error_str}")

        # Determine appropriate error message
        if "token" in error_str.lower() or "expired" in error_str.lower():
            error_message = "Password reset link has expired or is invalid"
            error_code = status.HTTP_401_UNAUTHORIZED
        elif "password" in error_str.lower():
            error_message = "Password does not meet requirements"
            error_code = status.HTTP_400_BAD_REQUEST
        else:
            error_message = "Failed to change password"
            error_code = status.HTTP_400_BAD_REQUEST

        raise HTTPException(status_code=error_code, detail=error_message)


@router.delete("/users/{user_id}", response_model=AuthResponse)
async def remove_user(user_id: str, current_user: UserData = Depends(get_current_user)):
    """
    Delete a user account.

    This endpoint requires authentication and can only be used
    to delete the user's own account or by an admin.

    Args:
        user_id: The ID of the user to delete
        current_user: The currently authenticated user

    Returns:
        Success message on successful deletion

    Raises:
        HTTPException: If the user is not found or deletion fails
    """
    # Check if the user is trying to delete their own account or is an admin
    if current_user.id != user_id:
        logger.warning(f"User {current_user.id} attempted to delete account {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own account",
        )
    try:
        logger.info(f"Deleting user account: {user_id}")
        await delete_user(user_id)
        logger.info(f"Successfully deleted user account: {user_id}")
        return AuthResponse(status="success", message="User deleted successfully")
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Account deletion error for user {user_id}: {str(e)}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account. Please try again later.",
        )
