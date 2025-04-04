"""Divination API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from ...models.auth import AuthenticatedSession
from ...models.divination import (
    IChingCoordinatesRequest,
    IChingCoordinatesResponse,
    IChingImageRequest,
    IChingReadingRequest,
    IChingReadingResponse,
    IChingSaveReadingRequest,
    IChingSaveReadingResponse,
    IChingTextRequest,
    IChingTextResponse,
    IChingUpdateReadingRequest,
    IChingUpdateReadingResponse,
)
from ...services.auth.dependencies import get_auth_tokens
from ...services.divination.iching import (
    fetch_iching_image_data,
    get_iching_coordinates_from_oracle,
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
    session: AuthenticatedSession = Depends(get_auth_tokens),
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


@router.get("/iching-image")
async def get_iching_image_data(
    parent_coord: str = Query(
        ..., description="Parent hexagram coordinate (e.g., '1-2')"
    ),
    child_coord: str = Query(..., description="Child hexagram coordinate (e.g., '3')"),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Get I Ching image data for a specific coordinate pair.

    This endpoint proxies requests to the Supabase storage bucket and returns the raw image data,
    bypassing browser authentication issues with direct signed URLs.

    Args:
        parent_coord: Parent hexagram coordinate (Query parameter)
        child_coord: Child hexagram coordinate (Query parameter)
        session: Authenticated session extracted from cookies

    Returns:
        Response: Raw image data with appropriate content type
    """
    logger.info(
        f"API: Getting image data for parent: {parent_coord}, child: {child_coord}"
    )

    try:
        # Create image request model
        image_request = IChingImageRequest(
            parent_coord=parent_coord, child_coord=child_coord
        )

        # Get the image bytes from the service
        image_bytes = await fetch_iching_image_data(
            request=image_request,
            access_token=session.access_token,
            refresh_token=session.refresh_token,
        )

        logger.info(
            f"API: Successfully retrieved image data, returning {len(image_bytes)} bytes"
        )

        # Return the raw image data
        return Response(content=image_bytes, media_type="image/jpeg")

    except HTTPException as http_error:
        # Re-raise HTTP exceptions with their status codes
        logger.error(f"HTTP error retrieving I Ching image: {http_error.detail}")
        raise http_error
    except Exception as e:
        logger.error(f"API error retrieving I Ching image data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve I Ching image data: {str(e)}",
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
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Generate a complete I Ching reading based on input numbers and question.

    This endpoint orchestrates the full I Ching reading process:
    1. Converts input numbers to coordinates
    2. Retrieves the appropriate hexagram text
    3. Generates the reading interpretation using LLM

    Args:
        request_data: Request model containing numbers, question, and preferences
        session: Authenticated session with tokens

    Returns:
        Complete I Ching reading with coordinates, text, and interpretation

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
    session: AuthenticatedSession = Depends(get_auth_tokens),
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
    session: AuthenticatedSession = Depends(get_auth_tokens),
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
