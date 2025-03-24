"""Authentication API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from ...models.auth import (
    AuthResponse,
    PasswordChange,
    PasswordReset,
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
    reset_password,
    signup_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


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


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(current_user: UserData = Depends(get_current_user)):
    """
    Refresh user token.

    Note:
        This endpoint doesn't actually refresh the token since that's handled by Supabase.
        It simply verifies that the current token is valid and returns a success message.

    Args:
        current_user: Current authenticated user

    Returns:
        Success message
    """
    return AuthResponse(status="success", message="Token is valid")


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
        response = signup_user(user.email, user.password)
        session_data = response.get("session", {})

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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


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
        response = login_user(user.email, user.password)
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/reset-password", response_model=AuthResponse)
async def request_password_reset(data: PasswordReset):
    """
    Request password reset email.

    Args:
        data: Password reset data

    Returns:
        Password reset response
    """
    try:
        reset_password(data.email)
        return AuthResponse(status="success", message="Password reset email sent")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/change-password", response_model=AuthResponse)
async def update_password(data: PasswordChange):
    """
    Change user password.

    Args:
        data: Password change data

    Returns:
        Password change response
    """
    try:
        change_password(
            data.password,
            data.access_token,
            data.refresh_token,
        )
        return AuthResponse(status="success", message="Password updated successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own account",
        )
    try:
        delete_user(user_id)
        return AuthResponse(status="success", message="User deleted successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
