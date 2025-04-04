import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from ...models.auth import AuthenticatedSession, UserData
from ...models.users import UserQuotaRequest, UserQuotaResponse, UserReadingResponse
from ...services.auth.dependencies import get_auth_tokens, get_current_user
from ...services.users.quota import create_user_quota, get_user_quota_from_db
from ...services.users.reading import get_user_readings_from_db

router = APIRouter(prefix="/user", tags=["user"])

logger = logging.getLogger(__name__)


@router.post("/quota", response_model=Optional[UserQuotaResponse])
async def get_user_quota(
    request_data: UserQuotaRequest,
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Get user quota information.

    If no quota exists for the user, returns None.

    Args:
        request_data: UserQuotaRequest containing user_id
        session: Authenticated session with tokens

    Returns:
        User quota information or None if not found

    Raises:
        HTTPException: If quota information cannot be retrieved
    """
    try:
        # Get existing quota and return it (could be None)
        return await get_user_quota_from_db(
            request_data, session.access_token, session.refresh_token
        )
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"Error retrieving user quota: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user quota: {str(e)}",
        )


@router.post("/quota/create", response_model=UserQuotaResponse)
async def create_quota(
    request_data: UserQuotaRequest,
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Create a new user quota or reset to default values.

    Args:
        request_data: UserQuotaRequest containing user_id
        session: Authenticated session with tokens

    Returns:
        Created user quota information

    Raises:
        HTTPException: If quota cannot be created
    """
    try:
        # Attempt to create the quota
        quota = await create_user_quota(
            request_data, session.access_token, session.refresh_token
        )
        return quota
    except Exception as e:
        # Log error and return a detailed error message
        logger.error(f"Failed to create user quota: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user quota: {str(e)}",
        )


@router.get("/readings", response_model=List[UserReadingResponse])
async def get_user_readings(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Get all historical readings for the authenticated user.

    Args:
        current_user: The authenticated user data obtained from the token.
        session: Authenticated session with tokens.

    Returns:
        A list of the user's historical readings.

    Raises:
        HTTPException: If readings cannot be retrieved.
    """
    logger.info(f"API: Fetching readings for user ID: {current_user.id}")
    try:
        readings = await get_user_readings_from_db(
            user_id=current_user.id,
            access_token=session.access_token,
            refresh_token=session.refresh_token,
        )
        return readings
    except Exception as e:
        logger.error(
            f"API error fetching readings for user {current_user.id}: {str(e)}"
        )
        # Propagate the specific error message from the service layer if possible
        detail_message = f"Failed to retrieve readings: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail_message,
        )
