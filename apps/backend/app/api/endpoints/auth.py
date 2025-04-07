"""Authentication API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ...models.auth import (
    AuthenticatedSession,
    AuthResponse,
    PasswordChange,
    PasswordReset,
    UserData,
    UserLogin,
    UserSession,
    UserSessionResponse,
    UserSignup,
)
from ...services.auth.dependencies import get_auth_tokens, get_current_user
from ...services.auth.supabase import (
    SupabaseAuthError,
    change_password,
    delete_user,
    login_user,
    logout_user,
    reset_password,
    signup_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger(__name__)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    expires_in: int = 3600,
    remember_me: bool = False,
) -> None:
    """
    Set secure HTTP-only cookies for authentication.

    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
        expires_in: Token expiration time in seconds
        remember_me: Whether to set a longer expiration time
    """

    # Set access token cookie (shorter lifespan)
    access_token_max_age = (
        30 * 24 * 60 * 60 if remember_me else expires_in
    )  # 30 days if remember_me
    response.set_cookie(
        key="auth_token",
        value=access_token,
        max_age=access_token_max_age,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
    )

    # Set refresh token cookie (longer lifespan)
    refresh_token_max_age = (
        30 * 24 * 60 * 60 if remember_me else 7 * 24 * 60 * 60
    )  # 30 days if remember_me, else 7 days
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_token_max_age,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """
    Clear authentication cookies.

    Args:
        response: FastAPI Response object
    """
    response.delete_cookie(key="auth_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


@router.get("/me", response_model=UserData)
async def get_current_user_info(
    current_user: UserData = Depends(get_current_user),
) -> UserData:
    """
    Get current authenticated user information.

    Args:
        current_user: User data from the authentication dependency

    Returns:
        Current user information
    """
    return current_user


@router.post("/signup", response_model=UserSessionResponse)
async def register_user(user: UserSignup, response: Response) -> UserSessionResponse:
    """
    Register a new user account.

    Args:
        user: User signup data with email and password
        response: Response object for setting cookies

    Returns:
        New user session information

    Raises:
        HTTPException: If registration fails
    """
    try:
        logger.info(f"Attempting to register user with email: {user.email}")

        # Register the user
        result = await signup_user(user.email, user.password)

        # Extract data
        session_data = result.get("session", {})
        user_data = result.get("user", {})

        logger.info(f"Successfully registered user: {user.email}")

        # Set authentication cookies
        set_auth_cookies(
            response,
            access_token=session_data.get("access_token", ""),
            refresh_token=session_data.get("refresh_token", ""),
            expires_in=session_data.get("expires_in", 3600),
        )

        return UserSessionResponse(
            success=True,
            data=UserSession(
                user=UserData(
                    id=user_data.get("id", ""),
                    email=user_data.get("email"),
                    created_at=user_data.get("created_at"),
                    last_sign_in_at=user_data.get("last_sign_in_at"),
                )
            ),
        )

    except SupabaseAuthError as e:
        # Use status code and message from our custom exception
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
        )
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration. Please try again.",
        )


@router.post("/login", response_model=UserSessionResponse)
async def login(user: UserLogin, response: Response) -> UserSessionResponse:
    """
    Authenticate a user and create a new session.

    Args:
        user: User login data with email and password
        response: Response object for setting cookies

    Returns:
        User session information

    Raises:
        HTTPException: If authentication fails
    """
    try:
        logger.info(f"Login attempt for user: {user.email}")

        # Authenticate the user
        result = await login_user(user.email, user.password)

        # Extract data
        session_data = result.get("session", {})
        user_data = result.get("user", {})

        logger.info(f"Successful login for user: {user.email}")

        # Set authentication cookies with remember_me flag
        set_auth_cookies(
            response,
            access_token=session_data.get("access_token", ""),
            refresh_token=session_data.get("refresh_token", ""),
            expires_in=session_data.get("expires_in", 3600),
            remember_me=user.remember_me,
        )

        return UserSessionResponse(
            success=True,
            data=UserSession(
                user=UserData(
                    id=user_data.get("id", ""),
                    email=user_data.get("email"),
                    created_at=user_data.get("created_at"),
                    last_sign_in_at=user_data.get("last_sign_in_at"),
                )
            ),
        )

    except SupabaseAuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
        )
    except Exception as e:
        logger.error(f"Login error for {user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )


@router.post("/password/reset", response_model=AuthResponse)
async def request_password_reset(data: PasswordReset) -> AuthResponse:
    """
    Request a password reset email.

    Args:
        data: Password reset request with email

    Returns:
        Success response
    """
    try:
        logger.info(f"Password reset requested for email: {data.email}")
        await reset_password(data.email)
        logger.info(f"Password reset email sent for: {data.email}")
        return AuthResponse(
            success=True,
            message="If an account with that email exists, a password reset link has been sent",
        )
    except Exception as e:
        # Always return success to avoid email enumeration attacks
        logger.error(f"Password reset error for {data.email}: {str(e)}")
        return AuthResponse(
            success=True,
            message="If an account with that email exists, a password reset link has been sent",
        )


@router.post("/password/change", response_model=AuthResponse)
async def update_password(
    data: PasswordChange,
    session: AuthenticatedSession = Depends(get_auth_tokens),
) -> AuthResponse:
    """
    Change the authenticated user's password.

    Args:
        data: New password
        session: Authenticated session with tokens

    Returns:
        Success response

    Raises:
        HTTPException: If password change fails
    """
    try:
        logger.info("Password change requested")
        await change_password(
            data.password,
            session.access_token,
            session.refresh_token,
        )
        logger.info("Password successfully changed")
        return AuthResponse(success=True, message="Password changed successfully")
    except SupabaseAuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
        )
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password. Please try again.",
        )


@router.delete("/users/{user_id}", response_model=AuthResponse)
async def remove_user(
    user_id: str,
    current_user: UserData = Depends(get_current_user),
    response: Response = None,
) -> AuthResponse:
    """
    Delete a user account.

    Args:
        user_id: The ID of the user to delete
        current_user: Currently authenticated user
        response: Response object for clearing cookies if deleting own account

    Returns:
        Success response

    Raises:
        HTTPException: If user is not allowed to delete the account or deletion fails
    """
    # Verify that the user is trying to delete their own account
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

        # Clear auth cookies when users delete their own account
        if response:
            clear_auth_cookies(response)

        return AuthResponse(success=True, message="Account deleted successfully")
    except SupabaseAuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
        )
    except Exception as e:
        logger.error(f"Account deletion error for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account. Please try again later.",
        )


@router.post("/logout", response_model=AuthResponse)
async def logout(
    response: Response,
    session: AuthenticatedSession = Depends(get_auth_tokens),
) -> AuthResponse:
    """
    Logout the current user by invalidating their session.

    Args:
        response: Response object for clearing cookies
        session: Current authentication session

    Returns:
        Success response
    """
    try:
        # Try to invalidate the session on Supabase
        await logout_user(session.access_token, session.refresh_token)
    except Exception as e:
        # Log but continue - we'll still clear cookies
        logger.error(f"Logout error with Supabase: {str(e)}")

    # Always clear cookies, even if Supabase call fails
    clear_auth_cookies(response)

    return AuthResponse(success=True, message="Logged out successfully")
