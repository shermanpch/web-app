"""Authentication dependencies for the application."""

import time
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk
from pydantic import ValidationError

from ..config import settings
from ..models.auth import TokenPayload, UserData
from .supabase import get_supabase_jwks

security = HTTPBearer()

# Cache for the JWKS keys
_JWKS_CACHE: Dict[str, Any] = {
    "keys": None,
    "last_updated": 0,
    "ttl": 3600,  # 1 hour cache TTL
}


def _get_jwks() -> Dict[str, Any]:
    """
    Get JWKS keys with caching.

    Returns:
        Dict containing JWKS keys
    """
    current_time = time.time()

    # Check if we need to refresh the cache
    if (
        _JWKS_CACHE["keys"] is None
        or current_time - _JWKS_CACHE["last_updated"] > _JWKS_CACHE["ttl"]
    ):

        # Fetch fresh JWKS
        jwks = get_supabase_jwks()
        _JWKS_CACHE["keys"] = jwks
        _JWKS_CACHE["last_updated"] = current_time

    return _JWKS_CACHE["keys"]


def _get_public_key(kid: Optional[str] = None) -> str:
    """
    Get the public key from JWKS for JWT verification.

    Args:
        kid: Key ID from the JWT header

    Returns:
        Public key as a string

    Raises:
        HTTPException: If the key cannot be found
    """
    jwks = _get_jwks()

    # If kid is not provided, use the first key
    if kid is None and jwks.get("keys") and len(jwks["keys"]) > 0:
        key_data = jwks["keys"][0]
    else:
        # Find the key with matching kid
        key_data = next(
            (key for key in jwks.get("keys", []) if key.get("kid") == kid),
            None,
        )

    if not key_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find appropriate key for JWT verification",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert JWK to a key using python-jose
    public_key = jwk.construct(key_data)
    return public_key.to_pem()


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

        try:
            # First try to decode using JWKS
            # Decode the token header to get the key ID (kid)
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")

            # Get the appropriate public key in PEM format
            public_key_pem = _get_public_key(kid)

            # Decode and verify the JWT token
            payload = jwt.decode(
                token,
                public_key_pem,
                algorithms=["RS256"],
                audience="authenticated",
                options={"verify_exp": True},
            )
        except Exception as jwks_error:
            # Fallback to JWT_SECRET for backwards compatibility
            # This is useful during testing or if JWKS is not available
            try:
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False, "verify_exp": True},
                )
            except Exception:
                # If fallback fails too, raise the original JWKS error
                raise jwks_error

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
