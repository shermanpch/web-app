"""Quota management for divination queries."""

import logging
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
                "user_id, membership_type, remaining_queries, created_at, updated_at"
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
                "user_id, membership_type, remaining_queries, created_at, updated_at"
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
