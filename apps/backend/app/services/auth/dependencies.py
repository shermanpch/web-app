"""Authentication dependencies for the application."""

from fastapi import Depends, HTTPException, Request, status

from ...models.auth import AuthenticatedSession, UserData
from .supabase import SupabaseAuthError, get_user


async def get_auth_tokens(request: Request) -> AuthenticatedSession:
    """
    Extract authentication tokens from either cookies or Authorization header.

    Prioritizes cookies, falls back to Authorization header if cookies are not present.

    Args:
        request: The incoming request

    Returns:
        AuthenticatedSession containing access and refresh tokens

    Raises:
        HTTPException: If no valid authentication is found
    """
    # Try to get tokens from cookies first
    auth_token = request.cookies.get("auth_token")
    refresh_token = request.cookies.get("refresh_token")

    # If cookies are not present, try Authorization header
    if not auth_token or not refresh_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            auth_token = auth_header.replace("Bearer ", "")
            # Note: Refresh token might still be missing when using header auth
            # In that case, operations requiring refresh token will fail

    # Check if we have at least an access token
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use empty string as fallback for refresh token
    # Some operations will still work with just the access token
    return AuthenticatedSession(
        access_token=auth_token,
        refresh_token=refresh_token or "",
    )


async def get_current_user(
    session: AuthenticatedSession = Depends(get_auth_tokens),
) -> UserData:
    """
    Validate authentication and return current user.

    Uses Supabase to verify the authentication tokens and get user information.

    Args:
        session: The authenticated session containing tokens

    Returns:
        UserData object with user information

    Raises:
        HTTPException: If authentication fails
    """
    try:
        user_response = await get_user(
            access_token=session.access_token, refresh_token=session.refresh_token
        )

        user = user_response.get("user", {})
        if not user or not user.get("id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UserData(
            id=user.get("id"),
            email=user.get("email"),
            last_sign_in_at=user.get("last_sign_in_at"),
            created_at=user.get("created_at"),
        )

    except SupabaseAuthError as e:
        # Use the status code and message from our custom exception
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Fallback for unexpected errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
