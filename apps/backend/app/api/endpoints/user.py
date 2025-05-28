"""User API endpoints."""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from ...models.auth import AuthenticatedSession, UserData
from ...models.users import (
    DeleteReadingResponse,
    UserProfileResponse,
    UserProfileStatusResponse,
    UserQuotaStatusResponse,
    UserReadingResponse,
    UserReadingsPaginatedResponse,
)
from ...services.auth.dependencies import get_auth_tokens, get_current_user
from ...services.auth.supabase import get_authenticated_client
from ...services.users.quota import (
    get_current_weekly_usage,
    get_feature_quota_rule,
    get_user_profile,
    upgrade_user_to_premium,
)
from ...services.users.reading import (
    delete_all_user_readings_from_db,
    delete_user_reading_from_db,
    get_reading_by_id,
    get_user_readings_from_db,
)

router = APIRouter(prefix="/user", tags=["user"])

logger = logging.getLogger(__name__)


@router.get("/profile", response_model=UserProfileStatusResponse)
async def get_user_status(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Get the authenticated user's profile and quota status.

    Args:
        current_user: The authenticated user data obtained from the token.
        session: Authenticated session with tokens.

    Returns:
        Combined profile and quota status information.

    Raises:
        HTTPException: If profile information cannot be retrieved.
    """
    logger.info(f"API: Fetching profile status for user ID: {current_user.id}")
    try:
        # Get authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        # Get user profile
        profile = await get_user_profile(UUID(current_user.id), client)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found",
            )

        # Get feature quotas
        feature_response = await client.from_("features").select("id, name").execute()
        features = feature_response.data

        quotas: list[UserQuotaStatusResponse] = []
        for feature in features:
            # Get quota rule
            quota_rule = await get_feature_quota_rule(
                profile.membership_tier_id, feature["id"], client
            )

            # Get current usage
            current_usage = await get_current_weekly_usage(
                UUID(current_user.id), feature["id"], client
            )

            # Calculate next week's start
            now = datetime.now(timezone.utc)
            days_until_next_week = 7 - now.weekday()
            next_week_start = (now + timedelta(days=days_until_next_week)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )

            # Create quota status
            quota_status = UserQuotaStatusResponse(
                feature_id=feature["id"],
                feature_name=feature["name"],
                limit=quota_rule["weekly_quota"] if quota_rule else None,
                used=current_usage,
                remaining=(
                    None
                    if not quota_rule or quota_rule["weekly_quota"] is None
                    else max(0, quota_rule["weekly_quota"] - current_usage)
                ),
                resets_at=next_week_start,
            )
            quotas.append(quota_status)

        return UserProfileStatusResponse(profile=profile, quotas=quotas)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user profile for {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}",
        )


@router.post("/profile/upgrade", response_model=UserProfileResponse)
async def upgrade_membership(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Upgrade the authenticated user's membership to premium.

    Args:
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        Updated user profile information

    Raises:
        HTTPException: If upgrade fails
    """
    logger.info(f"API: Upgrading membership for user ID: {current_user.id}")
    try:
        # Get authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        # Attempt to upgrade the user
        updated_profile = await upgrade_user_to_premium(UUID(current_user.id), client)
        return updated_profile

    except Exception as e:
        logger.error(f"Error upgrading user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/readings", response_model=UserReadingsPaginatedResponse)
async def get_user_readings(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Number of readings per page"),
):
    """
    Get historical readings for the authenticated user with pagination.

    Args:
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens
        page: Page number (1-indexed)
        limit: Number of readings per page (max 100)

    Returns:
        A paginated response with the user's historical readings and pagination metadata

    Raises:
        HTTPException: If readings cannot be retrieved
    """
    logger.info(
        f"API: Fetching readings for user ID: {current_user.id} (page: {page}, limit: {limit})"
    )
    try:
        # Get authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        paginated_result_dict = await get_user_readings_from_db(
            user_id=current_user.id,
            client=client,
            page=page,
            limit=limit,
        )
        return UserReadingsPaginatedResponse(**paginated_result_dict)
    except Exception as e:
        logger.error(
            f"API error fetching readings for user {current_user.id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve readings: {str(e)}",
        )


@router.delete("/readings/{reading_id}", response_model=DeleteReadingResponse)
async def delete_user_reading(
    reading_id: UUID = Path(..., description="The ID of the reading to delete"),
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Delete a specific reading for the authenticated user.

    Args:
        reading_id: The UUID of the reading to delete
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        DeleteReadingResponse with the result of the operation

    Raises:
        HTTPException: If the reading cannot be deleted
    """
    logger.info(f"API: Deleting reading {reading_id} for user ID: {current_user.id}")
    try:
        # Get authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        result = await delete_user_reading_from_db(
            user_id=current_user.id,
            reading_id=reading_id,
            client=client,
        )
        return result
    except Exception as e:
        error_msg = str(e).lower()
        if "not found" in error_msg or "does not belong" in error_msg:
            status_code = status.HTTP_404_NOT_FOUND
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

        logger.error(
            f"API error deleting reading {reading_id} for user {current_user.id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status_code,
            detail=str(e),
        )


@router.delete("/readings", response_model=DeleteReadingResponse)
async def delete_all_user_readings(
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Delete all readings for the authenticated user.

    Args:
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        DeleteReadingResponse with the result of the operation

    Raises:
        HTTPException: If the readings cannot be deleted
    """
    logger.info(f"API: Deleting all readings for user ID: {current_user.id}")
    try:
        # Get authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        result = await delete_all_user_readings_from_db(
            user_id=current_user.id,
            client=client,
        )
        return result
    except Exception as e:
        logger.error(
            f"API error deleting all readings for user {current_user.id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/readings/{reading_id}", response_model=UserReadingResponse)
async def get_user_reading(
    reading_id: UUID = Path(..., description="The ID of the reading to fetch"),
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Get a specific reading by ID for the authenticated user.

    Args:
        reading_id: The UUID of the reading to fetch
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        The requested reading if found and belongs to the user

    Raises:
        HTTPException: If the reading cannot be retrieved or doesn't belong to the user
    """
    logger.info(f"API: Fetching reading {reading_id} for user ID: {current_user.id}")
    try:
        # Get authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        reading = await get_reading_by_id(
            user_id=current_user.id,
            reading_id=reading_id,
            client=client,
        )
        if not reading:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reading not found or does not belong to the user",
            )
        return reading
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"API error fetching reading {reading_id} for user {current_user.id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
