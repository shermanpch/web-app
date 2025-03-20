"""Authentication API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from ...auth.dependencies import get_current_user
from ...auth.supabase import (
    change_password,
    delete_user,
    login_user,
    reset_password,
    signup_user,
)
from ...models.auth import (
    PasswordChange,
    PasswordReset,
    UserData,
    UserLogin,
    UserSignup,
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


@router.post("/refresh")
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
    return {"status": "success", "message": "Token is valid"}


@router.post("/signup")
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
        return {"status": "success", "data": response}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login")
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
        return {"status": "success", "data": response}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/reset-password")
async def request_password_reset(data: PasswordReset):
    """
    Request password reset email.

    Args:
        data: Password reset data

    Returns:
        Password reset response
    """
    try:
        response = reset_password(data.email)
        return {"status": "success", "message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/change-password")
async def update_password(data: PasswordChange):
    """
    Change user password.

    Args:
        data: Password change data

    Returns:
        Password change response
    """
    try:
        response = change_password(
            data.password,
            data.access_token,
            data.refresh_token,
        )
        return {"status": "success", "message": "Password updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/users/{user_id}")
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
        result = delete_user(user_id)
        return {"status": "success", "message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
