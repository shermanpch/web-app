"""Divination API endpoints."""

from fastapi import APIRouter, HTTPException, status

from ...divination.iching import get_iching_image_from_bucket, get_iching_text_from_db
from ...divination.quota import get_user_quota_from_db
from ...models.divination import IChingImage, IChingTextRequest, IChingTextResponse
from ...models.quota import UserQuota

router = APIRouter(prefix="/divination", tags=["divination"])


@router.get("/user-quota", response_model=UserQuota)
async def get_user_quota(user_id: str, access_token: str, refresh_token: str):
    """
    Get user quota information using access and refresh tokens.

    This endpoint allows passing tokens directly instead of using the authorization header.

    Args:
        user_id: ID of the user to get quota for
        access_token: User's access token from login
        refresh_token: User's refresh token from login

    Returns:
        User quota information

    Raises:
        HTTPException: If quota information cannot be retrieved
    """
    try:
        # Get the user quota using the provided tokens
        quota = get_user_quota_from_db(
            user_id=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        return quota
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user quota: {str(e)}",
        )


@router.post("/iching-text", response_model=IChingTextResponse)
async def get_iching_text(
    request: IChingTextRequest,
    access_token: str,
    refresh_token: str,
):
    """
    Get I Ching text using a provided access token and refresh token.

    This endpoint allows passing tokens directly instead of using the authorization header.

    Args:
        request: Request with parent and child coordinates
        access_token: User's access token from login
        refresh_token: User's refresh token from login

    Returns:
        I Ching text for the given coordinates

    Raises:
        HTTPException: If text cannot be retrieved
    """
    try:
        # Get the I Ching text using the provided tokens
        result = get_iching_text_from_db(
            request.parent_coord,
            request.child_coord,
            access_token=access_token,
            refresh_token=refresh_token,  # Pass the refresh token
        )

        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve I Ching text: {str(e)}",
        )


@router.get("/iching-image", response_model=IChingImage)
async def get_iching_image(
    parent_coord: str,
    child_coord: str,
    access_token: str,
    refresh_token: str,
):
    """
    Get I Ching hexagram image URL using a provided access token and refresh token.

    This endpoint allows passing tokens directly instead of using the authorization header.

    Args:
        parent_coord: Parent hexagram coordinate (e.g. "0-1")
        child_coord: Child hexagram coordinate (e.g. "1")
        access_token: User's access token from login
        refresh_token: User's refresh token from login

    Returns:
        IChingImage object with coordinates and image URL

    Raises:
        HTTPException: If image URL cannot be retrieved
    """
    try:
        # Get the I Ching image using the provided tokens
        iching_image = get_iching_image_from_bucket(
            parent_coord,
            child_coord,
            access_token=access_token,
            refresh_token=refresh_token,
        )

        return iching_image

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve I Ching image: {str(e)}",
        )
