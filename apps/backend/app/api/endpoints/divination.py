"""Divination API endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status

from ...models.divination import (
    IChingCoordinatesRequest,
    IChingCoordinatesResponse,
    IChingImageRequest,
    IChingImageResponse,
    IChingReadingRequest,
    IChingReadingResponse,
    IChingTextRequest,
    IChingTextResponse,
)
from ...services.core.oracle import Oracle
from ...services.divination.iching import (
    get_iching_image_from_bucket,
    get_iching_text_from_db,
)

router = APIRouter(prefix="/divination", tags=["divination"])

logger = logging.getLogger(__name__)


@router.post("/iching-text", response_model=IChingTextResponse)
async def get_iching_text(request: IChingTextRequest):
    """
    Get I Ching text using request data.

    Args:
        request: Request model containing parent and child coordinates and tokens

    Returns:
        I Ching text for the given coordinates

    Raises:
        HTTPException: If text cannot be retrieved
    """
    try:
        # Get the I Ching text using the request model
        result = get_iching_text_from_db(request)
        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve I Ching text: {str(e)}",
        )


@router.post("/iching-image", response_model=IChingImageResponse)
async def get_iching_image(request: IChingImageRequest):
    """
    Get I Ching hexagram image URL from the request data.

    Args:
        request: Request model containing parent and child coordinates and tokens

    Returns:
        IChingImage object with coordinates and image URL

    Raises:
        HTTPException: If image URL cannot be retrieved
    """
    try:
        # Get the I Ching image using the request model
        logger.info(
            f"API: Getting image for parent: {request.parent_coord}, child: {request.child_coord}"
        )
        logger.debug(
            f"Using access token starting with: {request.access_token[:10]}..."
        )
        logger.debug(
            f"Using refresh token starting with: {request.refresh_token[:10]}..."
        )

        try:
            iching_image = get_iching_image_from_bucket(request)
            logger.info(
                f"API: Successfully retrieved image URL: {iching_image.image_url}"
            )
            return iching_image

        except Exception as e:
            logger.error(f"Detailed error in get_iching_image_from_bucket: {str(e)}")
            # Re-raise with more details
            raise Exception(f"Failed to get image from bucket: {str(e)}")

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"API error getting I Ching image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve I Ching image: {str(e)}",
        )


@router.post("/iching-coordinates", response_model=IChingCoordinatesResponse)
async def get_iching_coordinates(request: IChingCoordinatesRequest):
    first_number = request.first_number
    second_number = request.second_number
    third_number = request.third_number
    oracle = Oracle()
    oracle.input(first_number, second_number, third_number)
    parent_coord, child_coord = oracle.convert_to_coordinates()
    return IChingCoordinatesResponse(parent_coord=parent_coord, child_coord=child_coord)


@router.post("/iching-reading", response_model=IChingReadingResponse)
async def get_iching_reading(reading: IChingReadingRequest):
    oracle = Oracle()
    oracle.input(reading.first_number, reading.second_number, reading.third_number)
    parent_coord, child_coord = oracle.convert_to_coordinates()

    text_request = IChingTextRequest(
        parent_coord=parent_coord,
        child_coord=child_coord,
        access_token=reading.access_token,
        refresh_token=reading.refresh_token,
    )

    image_request = IChingImageRequest(
        parent_coord=parent_coord,
        child_coord=child_coord,
        access_token=reading.access_token,
        refresh_token=reading.refresh_token,
    )

    text = get_iching_text_from_db(text_request)
    image = get_iching_image_from_bucket(image_request)
    return oracle.get_initial_reading(reading, text, image)
