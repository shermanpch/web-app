"""Quota management for divination queries."""

import logging
from typing import Optional

from ...models.users import UserQuotaRequest, UserQuotaResponse
from ...services.auth.supabase import get_authenticated_client, get_supabase_client

# Create logger
logger = logging.getLogger(__name__)


async def get_user_quota_from_db(
    request: UserQuotaRequest,
) -> Optional[UserQuotaResponse]:
    """
    Fetch user quota information from the database.

    Args:
        request: UserQuotaRequest containing user_id and auth tokens

    Returns:
        UserQuotaResponse object with user quota information, or None if not found

    Raises:
        Exception: If database query fails
    """
    logger.info(f"Fetching quota information for user: {request.user_id}")

    try:
        # Get Supabase client - use authenticated client if tokens provided
        if request.access_token and request.refresh_token:
            logger.debug("Using authenticated client with user tokens")
            client = await get_authenticated_client(
                request.access_token, request.refresh_token
            )
        else:
            client = await get_supabase_client()

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


async def create_user_quota(request: UserQuotaRequest) -> UserQuotaResponse:
    """
    Create a new user quota in the database.

    Args:
        request: UserQuotaRequest containing user_id and auth tokens

    Returns:
        UserQuotaResponse object with the created user quota information

    Raises:
        Exception: If quota cannot be created
    """
    logger.info(f"Creating new quota for user: {request.user_id}")

    try:
        # Get Supabase client - use authenticated client if tokens provided
        if request.access_token and request.refresh_token:
            logger.debug("Using authenticated client with user tokens")
            client = await get_authenticated_client(
                request.access_token, request.refresh_token
            )
        else:
            client = await get_supabase_client()

        default_quota = {
            "user_id": str(request.user_id),
            "membership_type": "free",
            "remaining_queries": 10,
        }

        # Insert the default quota
        insert_response = await (
            client.table("user_quotas").insert(default_quota).execute()
        )

        if insert_response.data and len(insert_response.data) > 0:
            logger.info(f"Created quota for user: {request.user_id}")
            return UserQuotaResponse(**insert_response.data[0])
        else:
            logger.error(f"Failed to insert quota for user: {request.user_id}")
            raise Exception("Database insertion returned empty response")
    except Exception as insert_error:
        logger.error(f"Error creating user quota: {str(insert_error)}")
        raise Exception(f"Failed to create user quota: {str(insert_error)}")
