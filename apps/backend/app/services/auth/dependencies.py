"""Authentication dependencies for the application."""

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from pydantic import ValidationError

from ...config import settings
from ...models.auth import TokenPayload, UserData

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

        # Decode using JWT_SECRET
        payload = jwt.decode(
            token,
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

    except (JWTError, ValidationError, jwt.PyJWTError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
