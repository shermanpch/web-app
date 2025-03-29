"""Divination API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ...models.auth import AuthenticatedSession
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
from ...services.auth.dependencies import require_auth_session_from_cookies
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
async def get_iching_text(
    request_data: IChingTextRequest,
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
):
    """
    Get I Ching text using request data.

    Args:
        request_data: Request model containing parent and child coordinates
        session: Authenticated session with tokens

    Returns:
        I Ching text for the given coordinates

    Raises:
        HTTPException: If text cannot be retrieved
    """
    try:
        # Get the I Ching text using the request model
        result = await get_iching_text_from_db(
            request_data,
            session.access_token,
            session.refresh_token,
        )
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
async def get_iching_image(
    request_data: IChingImageRequest,
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
) -> IChingImageResponse:
    """
    Get I Ching image for a specific coordinate pair.

    Args:
        request_data: Request containing parent_coord and child_coord
        session: Authenticated session extracted from cookies

    Returns:
        IChingImageResponse: Response with image URL
    """
    logger.info(
        f"API: Getting image for parent: {request_data.parent_coord}, child: {request_data.child_coord}"
    )

    try:
        # Get the image URL from the service
        result = await get_iching_image_from_bucket(
            request_data,
            session.access_token,
            session.refresh_token,
        )

        logger.info(f"API: Successfully retrieved image URL: {result.image_url}")

        # Return the image response directly
        return result

    except Exception as e:
        logger.error(f"API error retrieving I Ching image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve I Ching image: {str(e)}",
        )


@router.post("/iching-coordinates", response_model=IChingCoordinatesResponse)
async def get_iching_coordinates(request_data: IChingCoordinatesRequest):
    """
    Convert input numbers to I Ching coordinates.

    This endpoint translates the three input numbers into hexagram coordinates
    using modulo arithmetic to determine the parent and child coordinates.

    Args:
        request_data: Request model containing three numbers for coordinate calculation

    Returns:
        I Ching coordinates derived from the input numbers

    Raises:
        HTTPException: If coordinates cannot be generated
    """
    try:
        logger.info(
            f"API: Converting numbers to I Ching coordinates: {request_data.first_number}, {request_data.second_number}, {request_data.third_number}"
        )

        result = await get_iching_coordinates_from_oracle(request_data)

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
async def get_iching_reading(
    request_data: IChingReadingRequest,
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
):
    """
    Generate a complete I Ching reading based on input numbers and question.

    This endpoint orchestrates the full I Ching reading process:
    1. Converts input numbers to coordinates
    2. Retrieves the appropriate hexagram text
    3. Obtains the hexagram image
    4. Generates the reading interpretation using LLM

    Args:
        request_data: Request model containing numbers, question, and preferences
        session: Authenticated session with tokens

    Returns:
        Complete I Ching reading with coordinates, text, image, and interpretation

    Raises:
        HTTPException: If reading cannot be generated
    """
    try:
        # Get the complete I Ching reading
        logger.info(
            f"API: Generating I Ching reading for question: {request_data.question}"
        )

        result = await get_iching_reading_from_oracle(
            request_data,
            session.access_token,
            session.refresh_token,
        )

        logger.info(f"API: Successfully generated I Ching reading")
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
async def save_iching_reading(
    request_data: IChingSaveReadingRequest,
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
):
    """
    Save an I Ching reading to the user's saved readings.

    Args:
        request_data: Request model containing the reading data to save
        session: Authenticated session with tokens

    Returns:
        Response with save status and saved reading ID

    Raises:
        HTTPException: If reading cannot be saved
    """
    try:
        # Save the I Ching reading
        logger.info(f"API: Saving I Ching reading for user: {request_data.user_id}")

        result = await save_iching_reading_to_db(
            request_data, session.access_token, session.refresh_token
        )

        logger.info(f"API: Successfully saved I Ching reading: {result.id}")
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
async def update_iching_reading(
    request_data: IChingUpdateReadingRequest,
    session: AuthenticatedSession = Depends(require_auth_session_from_cookies),
):
    """
    Update an existing saved I Ching reading.

    Args:
        request_data: Request model containing the reading data to update
        session: Authenticated session with tokens

    Returns:
        Response with update status and updated reading ID

    Raises:
        HTTPException: If reading cannot be updated
    """
    try:
        # Update the I Ching reading
        logger.info(f"API: Updating I Ching reading: {request_data.id}")

        result = await update_iching_reading_in_db(
            request_data,
            session.access_token,
            session.refresh_token,
        )

        logger.info(f"API: Successfully updated I Ching reading: {result.id}")
        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return a generic error message
        logger.error(f"API error updating I Ching reading: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update I Ching reading: {str(e)}",
        )
