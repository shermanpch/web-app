import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from ...models.auth import AuthenticatedSession, UserData
from ...models.users import (
    UpdateUserQuotaRequest,
    UpdateUserQuotaResponse,
    UserQuotaRequest,
    UserQuotaResponse,
    UserReadingResponse,
)
from ...services.auth.dependencies import get_auth_tokens, get_current_user
from ...services.users.quota import (
    decrement_user_quota,
    get_user_quota_from_db,
    upgrade_user_to_premium,
)
from ...services.users.reading import get_user_readings_from_db

router = APIRouter(prefix="/user", tags=["user"])

logger = logging.getLogger(__name__)


@router.get("/quota", response_model=Optional[UserQuotaResponse])
async def get_user_quota(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Get the authenticated user's quota information.

    If no quota exists for the user, returns None.

    Args:
        current_user: The authenticated user data obtained from the token.
        session: Authenticated session with tokens.

    Returns:
        User quota information or None if not found.

    Raises:
        HTTPException: If quota information cannot be retrieved.
    """
    logger.info(f"API: Fetching quota for user ID: {current_user.id}")
    try:
        # Create the request internally using the authenticated user's ID
        quota_request = UserQuotaRequest(user_id=current_user.id)

        # Get existing quota and return it (could be None)
        quota_info = await get_user_quota_from_db(
            quota_request, session.access_token, session.refresh_token
        )
        return quota_info
    except Exception as e:
        logger.error(f"Error retrieving user quota for {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user quota: {str(e)}",
        )


@router.post("/quota/decrement", response_model=UpdateUserQuotaResponse)
async def decrement_quota(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Decrement the authenticated user's query quota by 1.

    Args:
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        Updated user quota information

    Raises:
        HTTPException: If quota cannot be decremented
    """
    try:
        # Create request with current user's ID
        request = UpdateUserQuotaRequest(user_id=current_user.id)

        # Attempt to decrement the quota
        return await decrement_user_quota(
            request, session.access_token, session.refresh_token
        )
    except Exception as e:
        # Map common error messages to appropriate HTTP status codes
        error_msg = str(e).lower()
        if "not found" in error_msg:
            status_code = status.HTTP_404_NOT_FOUND
        elif "insufficient" in error_msg:
            status_code = status.HTTP_403_FORBIDDEN
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

        logger.error(f"Error decrementing quota for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status_code,
            detail=str(e),
        )


@router.get("/readings", response_model=List[UserReadingResponse])
async def get_user_readings(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Get all historical readings for the authenticated user.

    Args:
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        A list of the user's historical readings

    Raises:
        HTTPException: If readings cannot be retrieved
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


@router.post("/quota/upgrade", response_model=UpdateUserQuotaResponse)
async def upgrade_membership(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Upgrade the authenticated user's membership to premium and add 30 queries.

    Args:
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        Updated user quota information with premium status

    Raises:
        HTTPException: If membership upgrade fails
    """
    logger.info(f"API: Upgrading membership for user ID: {current_user.id}")
    try:
        # Create request with current user's ID
        request = UpdateUserQuotaRequest(user_id=current_user.id)

        # Attempt to upgrade the membership
        return await upgrade_user_to_premium(
            request, session.access_token, session.refresh_token
        )
    except Exception as e:
        # Map common error messages to appropriate HTTP status codes
        error_msg = str(e).lower()
        if "not found" in error_msg:
            status_code = status.HTTP_404_NOT_FOUND
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

        logger.error(f"Error upgrading membership for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status_code,
            detail=str(e),
        )
