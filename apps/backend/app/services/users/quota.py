"""Quota management for divination queries."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from uuid import UUID

from supabase._async.client import AsyncClient

from ...models.users import UserProfileResponse

# Create logger
logger = logging.getLogger(__name__)


async def get_user_profile(
    user_id: UUID,
    client: AsyncClient,
) -> Optional[UserProfileResponse]:
    """
    Fetch user profile data from the profiles table, joining with membership_tiers for the tier name.

    Args:
        user_id: UUID of the user
        client: Authenticated Supabase client

    Returns:
        UserProfileResponse object with profile information, or None if not found

    Raises:
        Exception: If database query fails
    """
    logger.info(f"Fetching profile for user: {user_id}")

    try:
        # Query the profiles table with a join to membership_tiers
        # Using the public schema and proper foreign key relationship syntax
        response = (
            await client.from_("profiles")
            .select(
                """
                id,
                membership_tier_id,
                premium_expiration,
                created_at,
                updated_at,
                membership_tiers(name)
                """
            )
            .eq("id", str(user_id))
            .limit(1)
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data or len(data) == 0:
            logger.warning(f"No profile found for user: {user_id}")
            return None

        # Transform the joined data into our response model format
        profile_data = data[0]
        profile_data["membership_tier_name"] = profile_data["membership_tiers"]["name"]
        del profile_data["membership_tiers"]

        logger.info(f"Found profile for user: {user_id}")
        return UserProfileResponse(**profile_data)

    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        raise Exception(f"Failed to retrieve user profile: {str(e)}")


async def get_feature_quota_rule(
    tier_id: int,
    feature_id: int,
    client: AsyncClient,
) -> Optional[Dict]:
    """
    Get the quota rule for a specific membership tier and feature.

    Args:
        tier_id: ID of the membership tier
        feature_id: ID of the feature
        client: Authenticated Supabase client

    Returns:
        Dict containing the quota rule, or None if not found
    """
    logger.info(f"Fetching quota rule for tier {tier_id} and feature {feature_id}")

    try:
        response = (
            await client.from_("membership_feature_quota")
            .select("weekly_quota")
            .eq("membership_tier_id", tier_id)
            .eq("feature_id", feature_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    except Exception as e:
        logger.error(f"Error fetching feature quota rule: {str(e)}")
        raise Exception(f"Failed to retrieve feature quota rule: {str(e)}")


async def get_current_weekly_usage(
    user_id: UUID,
    feature_id: int,
    client: AsyncClient,
) -> int:
    """
    Count the number of times a user has used a feature this week.

    Args:
        user_id: UUID of the user
        feature_id: ID of the feature
        client: Authenticated Supabase client

    Returns:
        Number of times the feature was used this week
    """
    logger.info(f"Counting weekly usage for user {user_id} and feature {feature_id}")

    try:
        # Count divinations for this week
        # Use a simpler date format - start of the current week
        now = datetime.now(timezone.utc)
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

        response = (
            await client.from_("divinations")
            .select("id", count="exact")
            .eq("user_id", str(user_id))
            .eq("feature_id", feature_id)
            .gte("performed_at", start_of_week.isoformat())
            .execute()
        )

        return response.count or 0

    except Exception as e:
        logger.error(f"Error counting weekly usage: {str(e)}")
        raise Exception(f"Failed to count weekly usage: {str(e)}")


async def check_quota(
    user_id: UUID,
    feature_name: str,
    client: AsyncClient,
) -> bool:
    """
    Check if a user has quota remaining for a specific feature.

    Args:
        user_id: UUID of the user
        feature_name: Name of the feature to check
        client: Authenticated Supabase client

    Returns:
        True if user can use the feature, False if quota exceeded

    Raises:
        Exception: If feature not found or other database errors
    """
    logger.info(f"Checking quota for user {user_id} and feature {feature_name}")

    try:
        # Get feature ID
        feature_response = (
            await client.from_("features")
            .select("id")
            .eq("name", feature_name)
            .limit(1)
            .execute()
        )

        if not feature_response.data:
            raise Exception(f"Feature not found: {feature_name}")

        feature_id = feature_response.data[0]["id"]

        # Get user's profile and determine effective tier
        profile = await get_user_profile(user_id, client)
        if not profile:
            raise Exception("User profile not found")

        # If premium has expired, assume they're on the free tier
        if profile.premium_expiration and profile.premium_expiration < datetime.now(
            timezone.utc
        ):
            # Get free tier ID
            free_tier_response = (
                await client.from_("membership_tiers")
                .select("id")
                .eq("name", "free")
                .limit(1)
                .execute()
            )
            effective_tier_id = free_tier_response.data[0]["id"]
        else:
            effective_tier_id = profile.membership_tier_id

        # Get quota rule
        quota_rule = await get_feature_quota_rule(effective_tier_id, feature_id, client)

        # If no rule found or weekly_quota is NULL, assume unlimited
        if not quota_rule or quota_rule["weekly_quota"] is None:
            return True

        # Get current usage
        current_usage = await get_current_weekly_usage(user_id, feature_id, client)

        # Check if under quota
        return current_usage < quota_rule["weekly_quota"]

    except Exception as e:
        logger.error(f"Error checking quota: {str(e)}")
        raise Exception(f"Failed to check quota: {str(e)}")


async def log_usage(
    user_id: UUID,
    feature_name: str,
    client: AsyncClient,
    details: Optional[Dict] = None,
) -> None:
    """
    Log a feature usage event.

    Args:
        user_id: UUID of the user
        feature_name: Name of the feature used
        client: Authenticated Supabase client
        details: Optional JSON details about the usage

    Raises:
        Exception: If feature not found or logging fails
    """
    logger.info(f"Logging usage for user {user_id} and feature {feature_name}")

    try:
        # Get feature ID
        feature_response = (
            await client.from_("features")
            .select("id")
            .eq("name", feature_name)
            .limit(1)
            .execute()
        )

        if not feature_response.data:
            raise Exception(f"Feature not found: {feature_name}")

        feature_id = feature_response.data[0]["id"]

        # Insert usage log
        await client.from_("divinations").insert(
            {
                "user_id": str(user_id),
                "feature_id": feature_id,
                "details": details,
            }
        ).execute()

        logger.info("Usage logged successfully")

    except Exception as e:
        logger.error(f"Error logging usage: {str(e)}")
        raise Exception(f"Failed to log usage: {str(e)}")


async def upgrade_user_to_premium(
    user_id: UUID,
    client: AsyncClient,
) -> UserProfileResponse:
    """
    Upgrade a user to premium membership.

    Args:
        user_id: UUID of the user
        client: Authenticated Supabase client

    Returns:
        UserProfileResponse with updated profile information

    Raises:
        Exception: If profile not found or update fails
    """
    logger.info(f"Upgrading user {user_id} to premium")

    try:
        # Get premium tier ID
        premium_tier_response = (
            await client.from_("membership_tiers")
            .select("id")
            .eq("name", "premium")
            .limit(1)
            .execute()
        )

        if not premium_tier_response.data:
            raise Exception("Premium tier not found")

        premium_tier_id = premium_tier_response.data[0]["id"]

        # Calculate expiration (30 days from now)
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)

        # Update profile
        update_response = (
            await client.from_("profiles")
            .update(
                {
                    "membership_tier_id": premium_tier_id,
                    "premium_expiration": expires_at.isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("id", str(user_id))
            .execute()
        )

        if not update_response.data:
            raise Exception("Failed to upgrade user profile")

        # Return updated profile
        return await get_user_profile(user_id, client)

    except Exception as e:
        logger.error(f"Error upgrading user: {str(e)}")
        raise Exception(f"Failed to upgrade user: {str(e)}")
