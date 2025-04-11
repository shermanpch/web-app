"""Divination API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ...models.auth import AuthenticatedSession, UserData
from ...models.divination import (
    IChingCoordinatesRequest,
    IChingCoordinatesResponse,
    IChingReadingRequest,
    IChingReadingResponse,
    IChingSaveReadingRequest,
    IChingSaveReadingResponse,
    IChingTextRequest,
    IChingTextResponse,
    IChingUpdateReadingRequest,
    IChingUpdateReadingResponse,
)
from ...services.auth.dependencies import get_auth_tokens, get_current_user
from ...services.auth.supabase import get_authenticated_client
from ...services.divination.iching import (
    get_iching_coordinates_from_oracle,
    get_iching_reading_from_oracle,
    get_iching_text_from_db,
    save_iching_reading_to_db,
    update_iching_reading_in_db,
)
from ...services.users.quota import check_quota, log_usage

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
        # Create authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        # Get the I Ching text using the request model
        result = await get_iching_text_from_db(request_data, client)
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
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Generate a complete I Ching reading based on input numbers and question.

    This endpoint orchestrates the full I Ching reading process:
    1. Checks if user has quota available for basic divination
    2. Converts input numbers to coordinates
    3. Retrieves the appropriate hexagram text
    4. Generates the reading interpretation using LLM
    5. Logs the usage for quota tracking

    Args:
        request_data: Request model containing numbers, question, and preferences
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        Complete I Ching reading with coordinates, text, and interpretation

    Raises:
        HTTPException: If reading cannot be generated or quota is exceeded
    """
    try:
        # Create authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        # Check quota before proceeding
        await check_quota(current_user.id, "basic_divination", client)

        # Get the reading
        result = await get_iching_reading_from_oracle(request_data, client)

        # Log usage after successful reading
        await log_usage(current_user.id, "basic_divination", client)

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
    Save an I Ching reading to the database.

    Args:
        request_data: Request model containing reading details to save
        session: Authenticated session with tokens

    Returns:
        Saved reading details

    Raises:
        HTTPException: If reading cannot be saved
    """
    try:
        # Create authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        # Save the reading
        result = await save_iching_reading_to_db(request_data, client)
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
    current_user: UserData = Depends(get_current_user),
    session: AuthenticatedSession = Depends(get_auth_tokens),
):
    """
    Update an existing I Ching reading.

    Args:
        request_data: Request model containing updated reading details
        current_user: The authenticated user data obtained from the token
        session: Authenticated session with tokens

    Returns:
        Updated reading details

    Raises:
        HTTPException: If reading cannot be updated
    """
    try:
        # Create authenticated client
        client = await get_authenticated_client(
            session.access_token, session.refresh_token
        )

        # Check quota before proceeding with clarifying question
        if request_data.clarifying_question:
            await check_quota(current_user.id, "premium_divination", client)

        # Update the reading
        result = await update_iching_reading_in_db(request_data, client)

        # Log usage if clarifying question was added
        if request_data.clarifying_question:
            await log_usage(current_user.id, "premium_divination", client)

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
