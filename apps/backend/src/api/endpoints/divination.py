"""Divination API endpoints."""

from fastapi import APIRouter, Depends

from ...auth.dependencies import get_current_user
from ...divination.quota import get_user_quota
from ...models.auth import UserData

router = APIRouter(prefix="/divination", tags=["divination"])


@router.get("/user-quota", response_model=dict)
async def get_user_quota_info(current_user: UserData = Depends(get_current_user)):
    """
    Get current user's quota information.

    Args:
        current_user: Current authenticated user

    Returns:
        User quota information
    """
    quota = get_user_quota(current_user.id)
    return quota
