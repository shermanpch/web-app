"""I Ching divination utilities."""

import logging

from ...models.divination import (
    IChingImageRequest,
    IChingImageResponse,
    IChingTextRequest,
    IChingTextResponse,
)
from ...services.auth.supabase import get_authenticated_client, get_supabase_client

# Create logger
logger = logging.getLogger(__name__)


def get_iching_text_from_db(request: IChingTextRequest) -> IChingTextResponse:
    """
    Fetch I Ching text for given parent and child coordinates.

    Args:
        request: IChingTextRequest containing parent_coord, child_coord and auth tokens

    Returns:
        IChingTextResponse with parent and child text

    Raises:
        Exception: If text cannot be retrieved
    """
    logger.info(
        f"Fetching I Ching text for parent: {request.parent_coord}, child: {request.child_coord}"
    )

    try:
        # Get Supabase client - use authenticated client if tokens provided
        if request.access_token and request.refresh_token:
            logger.debug("Using authenticated client with user tokens")
            client = get_authenticated_client(
                request.access_token, request.refresh_token
            )
        else:
            client = get_supabase_client()

        # Query the iching_texts table
        response = (
            client.table("iching_texts")
            .select("parent_coord, child_coord, parent_text, child_text")
            .eq("parent_coord", request.parent_coord)
            .eq("child_coord", request.child_coord)
            .limit(1)
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data or len(data) == 0:
            logger.warning(
                f"No I Ching text found for parent: {request.parent_coord}, child: {request.child_coord}"
            )
            return IChingTextResponse(
                parent_coord=request.parent_coord,
                child_coord=request.child_coord,
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


def get_iching_image_from_bucket(request: IChingImageRequest) -> IChingImageResponse:
    """
    Fetch I Ching hexagram image URL from storage bucket for given coordinates.

    Args:
        request: IChingImageRequest containing parent_coord, child_coord and auth tokens

    Returns:
        IChingImageResponse: Object containing coordinates and image URL

    Raises:
        Exception: If image URL cannot be retrieved
    """
    logger.info(
        f"Fetching I Ching image for parent: {request.parent_coord}, child: {request.child_coord}"
    )

    try:
        # Construct the image path in the bucket
        image_path = f"{request.parent_coord}/{request.child_coord}/hexagram.jpg"
        bucket_name = "iching-images"

        # We must use an authenticated client since the bucket requires authentication
        if request.access_token and request.refresh_token:
            client = get_authenticated_client(
                request.access_token, request.refresh_token
            )
        else:
            raise ValueError("Authentication tokens required to access I Ching images")

        # Get a reference to the bucket and create a signed URL
        bucket = client.storage.from_(bucket_name)
        signed_url_response = bucket.create_signed_url(image_path, 3600)
        image_url = signed_url_response["signedURL"]

        return IChingImageResponse(
            parent_coord=request.parent_coord,
            child_coord=request.child_coord,
            image_url=image_url,
        )

    except Exception as e:
        logger.error(f"Error fetching I Ching image: {str(e)}")
        raise e
