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
    IChingSaveReadingRequest,
    IChingSaveReadingResponse,
    IChingTextRequest,
    IChingTextResponse,
    IChingUpdateReadingRequest,
    IChingUpdateReadingResponse,
)
from ...services.divination.iching import (
    get_iching_coordinates_from_oracle,
    get_iching_image_from_bucket,
    get_iching_reading_from_oracle,
    get_iching_text_from_db,
    save_iching_reading_to_db,
    update_iching_reading_in_db,
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
        result = await get_iching_text_from_db(request)
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
            iching_image = await get_iching_image_from_bucket(request)
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
    """
    Convert input numbers to I Ching coordinates.

    This endpoint translates the three input numbers into hexagram coordinates
    using modulo arithmetic to determine the parent and child coordinates.

    Args:
        request: Request model containing three numbers for coordinate calculation

    Returns:
        I Ching coordinates derived from the input numbers

    Raises:
        HTTPException: If coordinates cannot be generated
    """
    try:
        logger.info(
            f"API: Converting numbers to I Ching coordinates: {request.first_number}, {request.second_number}, {request.third_number}"
        )

        result = await get_iching_coordinates_from_oracle(request)

        logger.info(
            f"API: Successfully generated coordinates: parent={result.parent_coord}, child={result.child_coord}"
        )
        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"API error generating I Ching coordinates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate I Ching coordinates: {str(e)}",
        )


@router.post("/iching-reading", response_model=IChingReadingResponse)
async def get_iching_reading(request: IChingReadingRequest):
    """
    Generate a complete I Ching reading based on input numbers and question.

    This endpoint orchestrates the full I Ching reading process:
    1. Converts input numbers to coordinates
    2. Retrieves the appropriate hexagram text
    3. Obtains the hexagram image
    4. Generates the reading interpretation using LLM

    Args:
        request: Request model containing numbers, question, language and auth tokens

    Returns:
        Complete I Ching reading with interpretation, advice, and image path

    Raises:
        HTTPException: If reading cannot be generated
    """
    try:
        logger.info(
            f"API: Generating I Ching reading for question: '{request.question}'"
        )
        logger.info(
            f"Using numbers: {request.first_number}, {request.second_number}, {request.third_number} and language: {request.language}"
        )

        result = await get_iching_reading_from_oracle(request)

        logger.info(
            f"API: Successfully generated I Ching reading for hexagram: {result.hexagram_name}"
        )
        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"API error generating I Ching reading: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate I Ching reading: {str(e)}",
        )


@router.post("/iching-reading/save", response_model=IChingSaveReadingResponse)
async def save_iching_reading(request: IChingSaveReadingRequest):
    """
    Save I Ching reading to user_readings table.

    Args:
        request: Request model containing reading data and auth tokens

    Returns:
        Confirmation of successful save with reading id

    Raises:
        HTTPException: If reading cannot be saved
    """
    try:
        logger.info(f"API: Saving I Ching reading for user: {request.user_id}")

        result = await save_iching_reading_to_db(request)

        logger.info(f"API: Successfully saved I Ching reading with ID: {result.id}")
        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"API error saving I Ching reading: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save I Ching reading: {str(e)}",
        )


@router.post("/iching-reading/update", response_model=IChingUpdateReadingResponse)
async def update_iching_reading(request: IChingUpdateReadingRequest):
    """
    Update I Ching reading in user_readings table.

    This endpoint handles updating an existing I Ching reading with additional
    information such as a clarifying question. It will generate a new answer
    based on the original reading and the clarifying question.

    Args:
        request: Request model containing reading id, user id, original reading data,
                clarifying question, and auth tokens

    Returns:
        Updated reading with clarifying question and answer added

    Raises:
        HTTPException: If reading cannot be updated or user is not authenticated
    """
    try:
        logger.info(
            f"API: Updating I Ching reading for user: {request.user_id} and id: {request.id}"
        )
        logger.debug(
            f"Updating with clarifying question: {request.clarifying_question}"
        )

        # Update the reading in the database
        result = await update_iching_reading_in_db(request)
        logger.info(f"Successfully processed update for reading id: {request.id}")

        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        logger.warning(f"HTTP exception occurred during reading update")
        raise
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"API error updating I Ching reading: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update I Ching reading: {str(e)}",
        )
