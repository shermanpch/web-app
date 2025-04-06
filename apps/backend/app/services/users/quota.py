"""Quota management for divination queries."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from ...models.users import (
    UpdateUserQuotaRequest,
    UpdateUserQuotaResponse,
    UserQuotaRequest,
    UserQuotaResponse,
)
from ...services.auth.supabase import get_authenticated_client

# Create logger
logger = logging.getLogger(__name__)


async def get_user_quota_from_db(
    request: UserQuotaRequest,
    access_token: str,
    refresh_token: str,
) -> Optional[UserQuotaResponse]:
    """
    Fetch user quota information from the database.

    Args:
        request: UserQuotaRequest containing user_id
        access_token: User's access token
        refresh_token: User's refresh token

    Returns:
        UserQuotaResponse object with user quota information, or None if not found

    Raises:
        Exception: If database query fails
    """
    logger.info(f"Fetching quota information for user: {request.user_id}")

    try:
        # Get authenticated Supabase client with user tokens
        logger.debug("Using authenticated client with user tokens")
        client = await get_authenticated_client(access_token, refresh_token)

        # Query the user_quotas table - ensure user_id is a string
        response = (
            await client.table("user_quotas")
            .select(
                "user_id, membership_type, remaining_queries, premium_expires_at, created_at, updated_at"
            )
            .eq("user_id", str(request.user_id))  # Convert UUID to string
            .limit(1)
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data or len(data) == 0:
            logger.warning(f"No quota found for user: {request.user_id}")
            return None

        # Return the first (and should be only) result
        logger.info(f"Found quota for user: {request.user_id}")
        return UserQuotaResponse(**data[0])

    except Exception as e:
        logger.error(f"Error fetching user quota: {str(e)}")
        raise Exception(f"Failed to retrieve user quota: {str(e)}")


async def decrement_user_quota(
    request: UpdateUserQuotaRequest,
    access_token: str,
    refresh_token: str,
) -> UpdateUserQuotaResponse:
    """
    Decrement a user's query quota by 1.

    Args:
        request: UpdateUserQuotaRequest containing user_id
        access_token: User's access token
        refresh_token: User's refresh token

    Returns:
        UpdateUserQuotaResponse object with updated quota information

    Raises:
        Exception: If quota not found, insufficient queries, update fails, or database query fails
    """
    logger.info(f"Decrementing quota for user: {request.user_id}")

    try:
        # Get authenticated Supabase client with user tokens
        logger.debug("Using authenticated client with user tokens")
        client = await get_authenticated_client(access_token, refresh_token)

        # First fetch current quota
        response = (
            await client.table("user_quotas")
            .select(
                "user_id, membership_type, remaining_queries, premium_expires_at, created_at, updated_at"
            )
            .eq("user_id", str(request.user_id))  # Convert UUID to string
            .limit(1)
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data or len(data) == 0:
            logger.warning(f"No quota found for user: {request.user_id}")
            raise Exception("User quota not found")

        # Get current remaining queries
        current_remaining = data[0]["remaining_queries"]

        # Check if user has enough queries
        if current_remaining <= 0:
            logger.warning(f"Insufficient queries for user: {request.user_id}")
            raise Exception("Insufficient queries remaining")

        # Calculate new remaining count
        new_remaining = current_remaining - 1

        # Update the quota with optimistic concurrency check
        update_response = (
            await client.table("user_quotas")
            .update({"remaining_queries": new_remaining})
            .eq("user_id", str(request.user_id))
            .eq("remaining_queries", current_remaining)  # Optimistic concurrency check
            .execute()
        )

        # Check if update was successful
        if not update_response.data:
            logger.error(f"Failed to update quota for user: {request.user_id}")
            raise Exception("Failed to update quota. Please try again")

        # Return updated quota response
        logger.info(f"Successfully decremented quota for user: {request.user_id}")
        return UpdateUserQuotaResponse(**update_response.data[0])

    except Exception as e:
        logger.error(f"Error decrementing user quota: {str(e)}")
        raise Exception(f"Failed to decrement user quota: {str(e)}")


async def upgrade_user_to_premium(
    request: UpdateUserQuotaRequest,
    access_token: str,
    refresh_token: str,
) -> UpdateUserQuotaResponse:
    """
    Upgrade a user's membership to premium and add 30 queries to their quota.
    Sets premium expiration to 30 days from now.

    Args:
        request: UpdateUserQuotaRequest containing user_id
        access_token: User's access token
        refresh_token: User's refresh token

    Returns:
        UpdateUserQuotaResponse object with updated quota information

    Raises:
        Exception: If quota not found, update fails, or database query fails
    """
    logger.info(f"Starting premium upgrade process for user: {request.user_id}")

    try:
        # Get authenticated Supabase client with user tokens
        logger.debug("Using authenticated client with user tokens")
        client = await get_authenticated_client(access_token, refresh_token)

        # First fetch current quota
        response = (
            await client.table("user_quotas")
            .select(
                "user_id, membership_type, remaining_queries, premium_expires_at, created_at, updated_at"
            )
            .eq("user_id", str(request.user_id))  # Convert UUID to string
            .limit(1)
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data or len(data) == 0:
            logger.warning(f"No quota found for user: {request.user_id}")
            raise Exception("User quota not found")

        # Get current remaining queries
        current_remaining = data[0]["remaining_queries"]

        # Calculate new remaining count (add 30 queries)
        new_remaining = current_remaining + 30

        # # Calculate expiration date (30 days from now in UTC)
        # expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        # Calculate expiration date (10 seconds from now in UTC)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=10)

        # Update the quota
        update_response = (
            await client.table("user_quotas")
            .update(
                {
                    "membership_type": "premium",
                    "remaining_queries": new_remaining,
                    "premium_expires_at": expires_at.isoformat(),
                }
            )
            .eq("user_id", str(request.user_id))
            .execute()
        )

        # Check if update was successful
        if not update_response.data:
            logger.error(f"Failed to upgrade user: {request.user_id}")
            raise Exception("Failed to upgrade user membership. Please try again")

        # Return updated quota response
        logger.info(
            f"Successfully upgraded user {request.user_id} to premium membership"
        )
        return UpdateUserQuotaResponse(**update_response.data[0])

    except Exception as e:
        logger.error(f"Error upgrading user membership: {str(e)}")
        raise Exception(f"Failed to upgrade user membership: {str(e)}")
