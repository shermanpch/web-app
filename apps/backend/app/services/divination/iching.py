"""I Ching divination utilities."""

import logging

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
from ...services.auth.supabase import get_authenticated_client, get_supabase_client
from ...services.core.oracle import Oracle

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


def get_iching_coordinates_from_oracle(
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


def get_iching_reading_from_oracle(
    reading: IChingReadingRequest,
) -> IChingReadingResponse:
    """
    Generate a complete I Ching reading including coordinates, text, and image.

    Args:
        reading: IChingReadingRequest containing input numbers and auth tokens

    Returns:
        IChingReadingResponse with complete reading details

    Raises:
        Exception: If text or image cannot be retrieved
    """
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


def save_iching_reading_to_db(
    request: IChingSaveReadingRequest,
) -> IChingSaveReadingResponse:
    """
    Save I Ching reading data to user_readings table in Supabase.

    Args:
        request: IChingSaveReadingRequest containing reading data and auth tokens

    Returns:
        IChingSaveReadingResponse with database record details

    Raises:
        Exception: If reading cannot be saved
    """
    logger.info(f"Saving I Ching reading for user: {request.user_id}")

    try:
        # Get authenticated client - authentication is required for database writes
        if not request.access_token or not request.refresh_token:
            raise ValueError("Authentication tokens required to save readings")

        client = get_authenticated_client(request.access_token, request.refresh_token)

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
        response = client.table("user_readings").insert(reading_data).execute()

        # Check if we have any data from the insert
        data = response.data
        if not data or len(data) == 0:
            logger.warning(f"No data returned from user_readings insert")
            raise Exception("Failed to save I Ching reading - no response data")

        # Return success response with record details
        record = data[0]
        return IChingSaveReadingResponse(
            id=str(record["id"]),
            user_id=record["user_id"],
            created_at=str(record["created_at"]),
            success=True,
            message="I Ching reading saved successfully",
        )

    except Exception as e:
        logger.error(f"Error saving I Ching reading: {str(e)}")
        raise e


def update_iching_reading_in_db(
    request: IChingUpdateReadingRequest,
) -> IChingUpdateReadingResponse:
    """
    Update I Ching reading data in user_readings table in Supabase.

    Args:
        request: IChingUpdateReadingRequest containing reading id, user id, question,
                numbers, prediction data, and optional clarifying question with auth tokens

    Returns:
        IChingUpdateReadingResponse with updated reading details

    Raises:
        ValueError: If auth tokens are missing
        Exception: If reading cannot be updated or not found
    """
    logger.info(f"Updating I Ching reading for user: {request.user_id}")
    logger.info(f"Updating I Ching reading with id: {request.id}")

    try:
        # Get authenticated client - authentication is required for database writes
        if not request.access_token or not request.refresh_token:
            logger.error("Missing authentication tokens for update operation")
            raise ValueError("Authentication tokens required to update readings")

        client = get_authenticated_client(request.access_token, request.refresh_token)

        # Get the existing reading data
        logger.info(f"Fetching existing reading with id: {request.id}")
        reading_response = (
            client.table("user_readings").select("*").eq("id", request.id).execute()
        )

        data = reading_response.data
        if not data or len(data) == 0:
            logger.warning(f"No reading found with id: {request.id}")
            raise Exception("Reading not found")

        logger.info(f"Found existing reading, getting clarifying response")
        oracle = Oracle()
        response = oracle.get_clarifying_reading(request)

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
        db_response = (
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
