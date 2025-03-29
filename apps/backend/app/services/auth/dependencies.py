"""Authentication dependencies for the application."""

from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from pydantic import ValidationError

from ...config import settings
from ...models.auth import AuthenticatedSession, TokenPayload, UserData

# Make security optional to allow cookie-based auth as an alternative
security = HTTPBearer(auto_error=False)


async def require_auth_session_from_cookies(request: Request) -> AuthenticatedSession:
    """
    Reads auth and refresh tokens from cookies, validates the auth token,
    and returns them in an AuthenticatedSession object.

    Raises HTTPException(401) if cookies are missing or auth token is invalid.
    """
    # First check if cookies exist at all
    if not request.cookies:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication cookies missing",
        )

    access_token = request.cookies.get("auth_token")
    refresh_token = request.cookies.get("refresh_token")

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication cookie 'auth_token' missing",
        )
    if not refresh_token:
        # Decide if refresh token is strictly required for ALL endpoints.
        # If only needed for refresh itself, this check might be too strict here.
        # For now, assume it's required by services downstream.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication cookie 'refresh_token' missing",
        )

    try:
        # Validate the access token (signature, expiry)
        # payload = jwt.decode(...) # Decode if you need payload data like user_id
        jwt.decode(
            access_token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False, "verify_exp": True},
        )
        # user_id = payload.get('sub') # Extract if needed

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token has expired"
        )
    except jwt.PyJWTError as e:
        # Catch generic JWT errors (invalid signature, format, etc.)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid access token: {e}",
        )
    except Exception as e:
        # Catch unexpected errors during validation
        # Import and use logger if available in the project
        # logger.error(f"Unexpected error during token validation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token validation error",
        )

    # If validation passes, return the tokens
    return AuthenticatedSession(
        access_token=access_token,
        refresh_token=refresh_token,
        # user_id=user_id # Include if extracted
    )


async def get_current_user(
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
) -> UserData:
    """
    Verify JWT token and return user information.
    Uses the AuthenticatedSession obtained from cookies.

    Args:
        session: The authenticated session containing tokens

    Returns:
        UserData object containing user information

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Use the access token from the authenticated session
        access_token = session.access_token

        # Decode to extract user information
        payload = jwt.decode(
            access_token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False, "verify_exp": True},
        )

        token_data = TokenPayload(**payload)

        # Extract user data
        user_id = token_data.sub
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UserData(id=user_id, email=token_data.email)

    except (jwt.PyJWTError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
