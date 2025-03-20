"""Authentication dependencies for the application."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import ValidationError

from ..config import settings
from ..models.auth import TokenPayload, UserData

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserData:
    """
    Verify JWT token and return user information.

    Args:
        credentials: The HTTP authorization credentials (JWT token)

    Returns:
        UserData object containing user information

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Remove the "Bearer " prefix if present
        token = credentials.credentials

        # Decode the JWT token
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Skip audience verification for simplicity
        )

        token_data = TokenPayload(**payload)

        # Check if token is expired
        if token_data.exp is not None and token_data.is_token_expired():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Extract user data
        user_id = token_data.sub
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UserData(id=user_id, email=token_data.email)

    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
