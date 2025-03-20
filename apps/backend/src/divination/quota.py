"""Quota management for divination queries."""

import logging
from typing import Optional

from ..auth.supabase import get_authenticated_client, get_supabase_client
from ..models.quota import UserQuota

# Create logger
logger = logging.getLogger("quota")


def get_user_quota_from_db(
    user_id: str,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
) -> UserQuota:
    """
    Fetch user quota information from the database.

    Args:
        user_id: The ID of the user to retrieve quota for
        access_token: User's access token for authenticated requests (optional)
        refresh_token: User's refresh token for authenticated requests (optional)

    Returns:
        UserQuota object with user quota information

    Raises:
        Exception: If quota information cannot be retrieved
    """
    logger.info(f"Fetching quota information for user: {user_id}")

    try:
        # Get Supabase client - use authenticated client if tokens provided
        if access_token and refresh_token:
            logger.debug("Using authenticated client with user tokens")
            client = get_authenticated_client(access_token, refresh_token)
        else:
            client = get_supabase_client()

        # Query the user_quotas table
        response = (
            client.table("user_quotas")
            .select(
                "user_id, membership_type, remaining_queries, created_at, updated_at"
            )
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data or len(data) == 0:
            logger.warning(f"No quota found for user: {user_id}, creating default")

            # Create default quota values
            default_quota = {
                "user_id": user_id,
                "membership_type": "free",
                "remaining_queries": 10,
            }

            # Insert the default quota
            try:
                insert_response = (
                    client.table("user_quotas").insert(default_quota).execute()
                )

                if insert_response.data and len(insert_response.data) > 0:
                    logger.info(f"Created default quota for user: {user_id}")
                    return UserQuota(**insert_response.data[0])
                else:
                    logger.warning(
                        f"Failed to insert default quota for user: {user_id}"
                    )
                    # Fall back to returning the default without DB record
                    return UserQuota(
                        **default_quota,
                        created_at=None,
                        updated_at=None,
                    )
            except Exception as insert_error:
                logger.error(f"Error creating default quota: {str(insert_error)}")
                # Return default values if insertion fails
                return UserQuota(
                    **default_quota,
                    created_at=None,
                    updated_at=None,
                )

        # Return the first (and should be only) result
        logger.info(f"Found quota for user: {user_id}")
        return UserQuota(**data[0])

    except Exception as e:
        logger.error(f"Error fetching user quota: {str(e)}")
        # On error, return a default quota
        logger.warning(f"Returning default quota for user: {user_id} due to error")
        return UserQuota(
            user_id=user_id,
            membership_type="free",
            remaining_queries=10,
            created_at=None,
            updated_at=None,
        )
