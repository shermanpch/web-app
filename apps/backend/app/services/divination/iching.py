"""I Ching divination utilities."""

import logging

from fastapi import HTTPException
from supabase.client import AsyncClient

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
from ...services.core.oracle import Oracle

# Create logger
logger = logging.getLogger(__name__)


async def get_iching_text_from_db(
    request: IChingTextRequest,
    client: AsyncClient,
) -> IChingTextResponse:
    """
    Fetch I Ching text for given parent and child coordinates.

    Args:
        request: IChingTextRequest containing parent and child coordinates
        client: Authenticated Supabase client

    Returns:
        IChingTextResponse with parent and child text

    Raises:
        Exception: If text cannot be retrieved
    """
    logger.info(
        f"Fetching I Ching text for parent: {request.parent_coord}, child: {request.child_coord}"
    )

    try:
        # Query the iching_texts table
        response = await (
            client.from_("iching_texts")
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


async def fetch_iching_image_data(
    request: IChingImageRequest,
    client: AsyncClient,
) -> bytes:
    """
    Fetch I Ching hexagram image data (bytes) from storage bucket for given coordinates.

    Args:
        request: IChingImageRequest containing parent and child coordinates
        client: Authenticated Supabase client

    Returns:
        bytes: Raw image bytes

    Raises:
        HTTPException: If image data cannot be retrieved or not found
    """
    logger.info(
        f"Fetching I Ching image data for parent: {request.parent_coord}, child: {request.child_coord}"
    )

    try:
        # Construct the image path in the bucket
        image_path = f"{request.parent_coord}/{request.child_coord}/hexagram.jpg"
        bucket_name = "iching-images"

        # Get the image bytes directly
        bucket = client.storage.from_(bucket_name)
        try:
            response = await bucket.download(image_path)
            return response
        except Exception as download_error:
            logger.error(f"Error downloading image from Supabase: {download_error}")
            raise HTTPException(
                status_code=404, detail=f"Image not found: {image_path}"
            )

    except HTTPException as http_exception:
        # Re-raise HTTP exceptions with their status codes
        logger.error(f"HTTP error fetching I Ching image: {http_exception}")
        raise http_exception
    except Exception as e:
        logger.error(f"Error fetching I Ching image: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch I Ching image: {str(e)}"
        )


async def get_iching_coordinates_from_oracle(
    request: IChingCoordinatesRequest,
) -> IChingCoordinatesResponse:
    """
    Calculate I Ching hexagram coordinates based on input numbers.

    Args:
        request: IChingCoordinatesRequest containing first_number, second_number, and third_number

    Returns:
        IChingCoordinatesResponse with parent_coord and child_coord
    """
    first_number = request.first_number
    second_number = request.second_number
    third_number = request.third_number
    oracle = Oracle()
    oracle.input(first_number, second_number, third_number)
    parent_coord, child_coord = oracle.convert_to_coordinates()
    return IChingCoordinatesResponse(parent_coord=parent_coord, child_coord=child_coord)


async def get_iching_reading_from_oracle(
    request: IChingReadingRequest,
    client: AsyncClient,
) -> IChingReadingResponse:
    """
    Generate a complete I Ching reading including coordinates and text.

    Args:
        request: IChingReadingRequest containing input numbers and question
        client: Authenticated Supabase client

    Returns:
        IChingReadingResponse with complete reading details

    Raises:
        Exception: If text cannot be retrieved
    """
    oracle = Oracle()
    oracle.input(request.first_number, request.second_number, request.third_number)
    parent_coord, child_coord = oracle.convert_to_coordinates()

    text_request = IChingTextRequest(
        parent_coord=parent_coord,
        child_coord=child_coord,
    )

    # Get text data
    text = await get_iching_text_from_db(text_request, client)

    return await oracle.get_initial_reading(request, text)


async def save_iching_reading_to_db(
    request: IChingSaveReadingRequest,
    client: AsyncClient,
) -> IChingSaveReadingResponse:
    """
    Save an I Ching reading to the database.

    Args:
        request: IChingSaveReadingRequest containing reading details
        client: Authenticated Supabase client

    Returns:
        IChingSaveReadingResponse with saved reading details

    Raises:
        Exception: If reading cannot be saved
    """
    logger.info(f"Saving I Ching reading for user: {request.user_id}")

    try:
        # Prepare reading data
        reading_data = {
            "user_id": request.user_id,
            "question": request.question,
            "first_number": request.first_number,
            "second_number": request.second_number,
            "third_number": request.third_number,
            "language": request.language,
        }

        # Add optional fields if provided
        if request.prediction:
            # Convert the IChingPrediction model to a dictionary for storage
            reading_data["prediction"] = request.prediction.model_dump()
        if request.clarifying_question:
            reading_data["clarifying_question"] = request.clarifying_question
        if request.clarifying_answer:
            reading_data["clarifying_answer"] = request.clarifying_answer

        # Insert data into user_readings table
        response = await client.from_("user_readings").insert(reading_data).execute()

        # Check if we have any data from the insert
        data = response.data
        if not data or len(data) == 0:
            logger.warning(f"No data returned from user_readings insert")
            raise Exception("Failed to save I Ching reading - no response data")

        # Return success response
        return IChingSaveReadingResponse(
            id=data[0]["id"],
            user_id=data[0]["user_id"],
            created_at=data[0]["created_at"],
            success=True,
            message="Reading saved successfully",
        )

    except Exception as e:
        logger.error(f"Error saving I Ching reading: {str(e)}")
        raise e


async def update_iching_reading_in_db(
    request: IChingUpdateReadingRequest,
    client: AsyncClient,
) -> IChingUpdateReadingResponse:
    """
    Update an existing I Ching reading in the database.

    Args:
        request: IChingUpdateReadingRequest containing updated reading details
        client: Authenticated Supabase client

    Returns:
        IChingUpdateReadingResponse with updated reading details

    Raises:
        Exception: If reading cannot be updated
    """
    logger.info(f"Updating I Ching reading for user: {request.user_id}")
    logger.info(f"Updating I Ching reading with id: {request.id}")

    try:
        # Get the existing reading data
        logger.info(f"Fetching existing reading with id: {request.id}")
        reading_response = await (
            client.table("user_readings").select("*").eq("id", request.id).execute()
        )

        data = reading_response.data
        if not data or len(data) == 0:
            logger.warning(f"No reading found with id: {request.id}")
            raise Exception("Reading not found")

        logger.info(f"Found existing reading, getting clarifying response")
        oracle = Oracle()
        response = await oracle.get_clarifying_reading(request)

        # Prepare update data
        logger.info("Preparing data for database update")
        update_data = {
            "question": response.question,
            "prediction": response.prediction.model_dump(),
            "clarifying_question": response.clarifying_question,
            "clarifying_answer": response.clarifying_answer,
        }

        # Update the record in the database
        logger.info(f"Updating reading with id: {response.id}")
        db_response = await (
            client.table("user_readings")
            .update(update_data)
            .eq("id", response.id)
            .eq("user_id", response.user_id)  # Ensure the user owns this reading
            .execute()
        )

        # Check if update was successful
        if not db_response.data or len(db_response.data) == 0:
            logger.error(f"Failed to update reading with id: {response.id}")
            raise Exception("Failed to update reading - no response data")

        logger.info(f"Successfully updated reading with id: {response.id}")
        return response

    except Exception as e:
        logger.error(f"Error updating I Ching reading: {str(e)}")
        raise e
