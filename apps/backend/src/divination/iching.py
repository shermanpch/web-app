"""I Ching divination utilities."""

import logging
from typing import Optional

from ..auth.supabase import get_authenticated_client, get_supabase_client
from ..models.divination import IChingImage, IChingTextResponse

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


def get_iching_image_from_bucket(
    parent_coord: str,
    child_coord: str,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
) -> IChingImage:
    """
    Fetch I Ching hexagram image URL from storage bucket for given coordinates.

    Args:
        parent_coord: Parent hexagram coordinate (e.g. "0-1")
        child_coord: Child hexagram coordinate (e.g. "1")
        access_token: User's access token for authenticated requests (optional)
        refresh_token: User's refresh token for authenticated requests (optional)

    Returns:
        IChingImage: Object containing coordinates and image URL

    Raises:
        Exception: If image URL cannot be retrieved
    """
    logger.info(
        f"Fetching I Ching image for parent: {parent_coord}, child: {child_coord}"
    )

    try:
        # Construct the image path in the bucket
        image_path = f"{parent_coord}/{child_coord}/hexagram.jpg"
        bucket_name = "iching-images"

        # We must use an authenticated client since the bucket requires authentication
        if access_token and refresh_token:
            client = get_authenticated_client(access_token, refresh_token)
        else:
            raise ValueError("Authentication tokens required to access I Ching images")

        # Get a reference to the bucket and create a signed URL
        bucket = client.storage.from_(bucket_name)
        signed_url_response = bucket.create_signed_url(image_path, 3600)
        image_url = signed_url_response["signedURL"]

        return IChingImage(
            parent_coord=parent_coord,
            child_coord=child_coord,
            image_url=image_url,
        )

    except Exception as e:
        logger.error(f"Error fetching I Ching image: {str(e)}")
        raise e
