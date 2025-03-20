"""I Ching divination utilities."""

import logging
from typing import Optional

from ..auth.supabase import get_authenticated_client, get_supabase_client
from ..models.divination import IChingTextResponse

# Create logger
logger = logging.getLogger("divination")


def get_iching_text_from_db(
    parent_coord: str,
    child_coord: str,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
) -> IChingTextResponse:
    """
    Fetch I Ching text for given parent and child coordinates.

    Args:
        parent_coord: Parent hexagram coordinate
        child_coord: Child hexagram coordinate
        access_token: User's access token for authenticated requests (optional)
        refresh_token: User's refresh token for authenticated requests (optional)

    Returns:
        IChingTextResponse with parent and child text

    Raises:
        Exception: If text cannot be retrieved
    """
    logger.info(
        f"Fetching I Ching text for parent: {parent_coord}, child: {child_coord}"
    )

    try:
        # Get Supabase client - use authenticated client if tokens provided
        if access_token and refresh_token:
            logger.debug("Using authenticated client with user tokens")
            client = get_authenticated_client(access_token, refresh_token)
        else:
            client = get_supabase_client()

        # Query the iching_texts table
        response = (
            client.table("iching_texts")
            .select("parent_coord, child_coord, parent_text, child_text")
            .eq("parent_coord", parent_coord)
            .eq("child_coord", child_coord)
            .limit(1)
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data or len(data) == 0:
            logger.warning(
                f"No I Ching text found for parent: {parent_coord}, child: {child_coord}"
            )
            return IChingTextResponse(
                parent_coord=parent_coord,
                child_coord=child_coord,
                parent_text=None,
                child_text=None,
            )

        # Return the first (and should be only) result
        record = data[0]
        return IChingTextResponse(
            parent_coord=record["parent_coord"],
            child_coord=record["child_coord"],
            parent_text=record["parent_text"],
            child_text=record["child_text"],
        )

    except Exception as e:
        logger.error(f"Error fetching I Ching text: {str(e)}")
        raise e
