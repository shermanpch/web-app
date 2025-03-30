"""Authentication API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ...config import settings
from ...models.auth import (
    AuthenticatedSession,
    AuthResponse,
    PasswordChange,
    PasswordReset,
    UserData,
    UserLogin,
    UserSessionData,
    UserSessionResponse,
    UserSignup,
)
from ...services.auth import (
    change_password,
    delete_user,
    login_user,
    logout_user,
    refresh_user_session,
    reset_password,
    signup_user,
)
from ...services.auth.dependencies import (
    get_current_user,
    require_auth_session_from_cookies,
)

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger(__name__)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    expires_in: int = 3600,
):
    """
    Set authentication cookies on the response.

    Args:
        response: FastAPI Response object
        access_token: User access token
        refresh_token: User refresh token
        expires_in: Token expiration time in seconds
    """
    # Set secure flag based on environment
    secure_flag = settings.ENVIRONMENT.lower() in ["production", "staging"]
    refresh_token_max_age_seconds = 7 * 24 * 60 * 60  # 7 days

    # In production/staging, use SameSite=None for cross-domain cookie access
    # In development, use Lax which is more permissive for same-domain
    samesite_value = "none" if secure_flag else "lax"

    # Set cookies
    response.set_cookie(
        key="auth_token",
        value=access_token,
        max_age=expires_in,
        httponly=True,
        secure=secure_flag,
        samesite=samesite_value,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_token_max_age_seconds,
        httponly=True,
        secure=secure_flag,
        samesite=samesite_value,
        path="/",
    )


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
async def refresh_session(
    response: Response,
    request: Request,
):
    """
    Refresh a user session token.

    Gets refresh token from cookies.

    Args:
        response: FastAPI Response object for setting cookies
        request: FastAPI Request object for cookie extraction

    Returns:
        New session tokens
    """
    try:
        # Get refresh token from cookies
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token missing from cookies",
            )

        response_data = await refresh_user_session(refresh_token)

        # Extract token data
        access_token = response_data.get("access_token", "")
        refresh_token = response_data.get("refresh_token", "")
        expires_in = response_data.get("expires_in", 3600)

        # Set authentication cookies
        set_auth_cookies(response, access_token, refresh_token, expires_in)

        return UserSessionResponse(
            status="success",
            data=UserSessionData(
                user=response_data.get("user", {}),
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
async def register_user(user: UserSignup, response: Response):
    """
    Register a new user.

    Args:
        user: User signup data
        response: FastAPI Response object for setting cookies

    Returns:
        User registration response
    """
    try:
        logger.info(f"Attempting to register new user with email: {user.email}")
        response_data = await signup_user(user.email, user.password)
        session_data = response_data.get("session", {})
        logger.info(f"Successfully registered new user with email: {user.email}")

        # Extract token data
        access_token = session_data.get("access_token", "")
        refresh_token = session_data.get("refresh_token", "")
        expires_in = session_data.get("expires_in", 3600)

        # Set authentication cookies
        set_auth_cookies(response, access_token, refresh_token, expires_in)

        return UserSessionResponse(
            status="success",
            data=UserSessionData(
                user=response_data.get("user", {}),
            ),
        )
    except Exception as e:
        error_str = str(e)

        # Log the actual error for debugging
        logger.error(f"Signup error for {user.email}: {error_str}")

        # Determine the appropriate error message based on the exception
        if "422 client error: unprocessable entity" in error_str.lower():
            error_message = "This email is already registered"
            error_code = status.HTTP_409_CONFLICT
        else:
            error_message = "Failed to create account"
            error_code = status.HTTP_400_BAD_REQUEST

        raise HTTPException(status_code=error_code, detail=error_message)


@router.post("/login", response_model=UserSessionResponse)
async def login(user: UserLogin, response: Response):
    """
    Login a user.

    Args:
        user: User login data
        response: FastAPI Response object for setting cookies

    Returns:
        User login response with access token
    """
    try:
        logger.info(f"Login attempt for user: {user.email}")
        response_data = await login_user(user.email, user.password)
        logger.info(f"Successful login for user: {user.email}")

        # Extract token data
        access_token = response_data.get("access_token", "")
        refresh_token = response_data.get("refresh_token", "")
        expires_in = response_data.get("expires_in", 3600)

        # Set authentication cookies
        set_auth_cookies(response, access_token, refresh_token, expires_in)

        return UserSessionResponse(
            status="success",
            data=UserSessionData(
                user=response_data.get("user", {}),
            ),
        )
    except Exception as e:
        error_str = str(e)

        # Log the actual error for debugging
        logger.error(f"Login error for {user.email}: {error_str}")

        error_message = "Invalid email or password"

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

        return AuthResponse(
            status="success",
            message="If an account with that email exists, a password reset link has been sent",
        )


@router.post("/password/change", response_model=AuthResponse)
async def update_password(
    data: PasswordChange,
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
):
    """
    Change user password.

    Args:
        data: Password change data
        session: Authenticated session with tokens

    Returns:
        Password change response
    """
    try:
        logger.info("Password change requested")
        await change_password(data.password, session.access_token)
        logger.info("Password successfully changed")
        return AuthResponse(status="success", message="Password changed successfully")
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Password change error: {str(e)}")

        error_message = "Failed to change password"
        if "invalid" in str(e).lower():
            error_message = "Your session has expired. Please log in again."

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )


@router.delete("/users/{user_id}", response_model=AuthResponse)
async def remove_user(
    user_id: str,
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
):
    """
    Delete a user account.

    This endpoint requires authentication and can only be used
    to delete the user's own account or by an admin.

    Args:
        user_id: The ID of the user to delete
        current_user: The currently authenticated user
        session: The authenticated session (for cookie-based auth)

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


@router.post("/logout", response_model=AuthResponse)
async def logout(
    response: Response,
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
):
    """
    Logout a user by invalidating their session.

    Args:
        response: FastAPI Response object for clearing cookies
        session: Current user's session information

    Returns:
        Success response
    """
    try:
        # Invalidate the session in Supabase
        await logout_user(session.access_token)

        # Clear auth cookies
        response.delete_cookie(key="auth_token", path="/")
        response.delete_cookie(key="refresh_token", path="/")

        return AuthResponse(
            status="success",
            message="Logged out successfully",
        )
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")

        # Even if there's an error with Supabase, clear the cookies
        response.delete_cookie(key="auth_token", path="/")
        response.delete_cookie(key="refresh_token", path="/")

        # Return success regardless to ensure frontend proceeds with logout
        return AuthResponse(
            status="success",
            message="Logged out successfully",
        )
