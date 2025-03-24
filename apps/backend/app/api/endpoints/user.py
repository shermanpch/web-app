import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from ...models.users import UserQuotaRequest, UserQuotaResponse
from ...services.users.quota import create_user_quota, get_user_quota_from_db

router = APIRouter(prefix="/user", tags=["user"])

logger = logging.getLogger(__name__)


@router.post("/quota", response_model=Optional[UserQuotaResponse])
async def get_user_quota(request: UserQuotaRequest):
    """
    Get user quota information.

    If no quota exists for the user, returns None.

    Args:
        request: UserQuotaRequest containing user_id and auth tokens

    Returns:
        User quota information or None if not found

    Raises:
        HTTPException: If quota information cannot be retrieved
    """
    try:
        # Get existing quota and return it (could be None)
        return await get_user_quota_from_db(request)
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"Error retrieving user quota: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user quota: {str(e)}",
        )


@router.post("/quota/create", response_model=UserQuotaResponse)
async def create_quota(request: UserQuotaRequest):
    """
    Create a new user quota or reset to default values.

    Args:
        request: UserQuotaRequest containing user_id and auth tokens

    Returns:
        Created user quota information

    Raises:
        HTTPException: If quota cannot be created
    """
    try:
        # Attempt to create the quota
        quota = await create_user_quota(request)
        return quota
    except Exception as e:
        # Log error and return a detailed error message
        logger.error(f"Failed to create user quota: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user quota: {str(e)}",
        )
