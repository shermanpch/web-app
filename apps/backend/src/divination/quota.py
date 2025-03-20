"""Quota management for divination queries."""

from ..auth.supabase import get_supabase_client
from ..models.divination import UserQuota


def get_user_quota(user_id: str) -> dict:
    """
    Get user quota information.

    Note:
        This now returns a default quota without interacting with the database
        since the user_quotas table is no longer used.

    Args:
        user_id: User ID

    Returns:
        User quota details
    """
    # Return a default quota without database interaction
    default_quota = {
        "user_id": user_id,
        "membership_type": "free",
        "remaining_queries": 10,
        "created_at": None,
        "updated_at": None,
    }

    return default_quota
