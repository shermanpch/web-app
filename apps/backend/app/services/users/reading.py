"""Service functions for user readings."""

import logging
import math
from uuid import UUID

from supabase._async.client import AsyncClient

from ...models.users import DeleteReadingResponse, UserReadingResponse

# Create logger
logger = logging.getLogger(__name__)


async def get_user_readings_from_db(
    user_id: UUID, client: AsyncClient, page: int = 1, limit: int = 10
) -> dict:
    """
    Fetch paginated historical readings for a specific user from the database.

    Args:
        user_id: The UUID of the user whose readings are to be fetched.
        client: Authenticated Supabase client instance.
        page: The page number (1-indexed).
        limit: The number of readings per page.

    Returns:
        A dictionary containing the paginated items and metadata.

    Raises:
        Exception: If the database query fails.
    """
    logger.info(f"Fetching readings for user: {user_id} (page: {page}, limit: {limit})")

    try:
        # Get total count of readings for the user
        count_response = (
            await client.from_("user_readings")
            .select("id", count="exact")
            .eq("user_id", str(user_id))
            .execute()
        )
        total_items = count_response.count if count_response.count is not None else 0

        # Calculate total pages
        if total_items == 0:
            total_pages = 0
        elif limit <= 0:  # Should not happen with Query validation but good to handle
            total_pages = 1 if total_items > 0 else 0
        else:
            total_pages = math.ceil(total_items / limit)

        # Calculate offset from page and limit
        offset = (page - 1) * limit

        # Query the user_readings table with pagination
        response = (
            await client.from_("user_readings")
            .select(
                "id, user_id, question, mode, language, first_number, second_number, third_number, prediction, clarifying_question, clarifying_answer, created_at"
            )
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)  # Order by most recent first
            .range(offset, offset + limit - 1)  # Apply pagination
            .execute()
        )

        # Check if we have any data
        data = response.data
        items_list = (
            [UserReadingResponse.model_validate(item) for item in data] if data else []
        )

        logger.info(
            f"Found {len(items_list)} readings for user: {user_id} on page {page}. Total items: {total_items}, Total pages: {total_pages}"
        )

        return {
            "items": items_list,
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": limit,
        }

    except Exception as e:
        logger.error(f"Error fetching user readings for {user_id}: {str(e)}")
        # Re-raise the exception to be handled by the API endpoint
        raise Exception(f"Failed to retrieve user readings: {str(e)}")


async def delete_user_reading_from_db(
    user_id: UUID, reading_id: UUID, client: AsyncClient
) -> DeleteReadingResponse:
    """
    Delete a specific reading for a user from the database.

    Args:
        user_id: The UUID of the user whose reading is to be deleted.
        reading_id: The UUID of the reading to delete.
        client: Authenticated Supabase client instance.

    Returns:
        DeleteReadingResponse with the result of the operation.

    Raises:
        Exception: If the reading doesn't exist or cannot be deleted.
    """
    logger.info(f"Deleting reading {reading_id} for user: {user_id}")

    try:
        # First verify the reading belongs to the user
        verify_response = (
            await client.from_("user_readings")
            .select("id")
            .eq("id", str(reading_id))
            .eq("user_id", str(user_id))
            .execute()
        )

        if not verify_response.data:
            logger.warning(f"Reading {reading_id} not found for user {user_id}")
            raise Exception("Reading not found or does not belong to the user")

        # Delete the reading
        delete_response = (
            await client.from_("user_readings")
            .delete()
            .eq("id", str(reading_id))
            .eq("user_id", str(user_id))  # Ensure we only delete user's own readings
            .execute()
        )

        if not delete_response.data:
            raise Exception("Failed to delete reading")

        logger.info(f"Successfully deleted reading {reading_id} for user {user_id}")
        return DeleteReadingResponse(
            success=True,
            reading_id=reading_id,
            user_id=user_id,
            message="Reading deleted successfully",
        )

    except Exception as e:
        logger.error(
            f"Error deleting reading {reading_id} for user {user_id}: {str(e)}"
        )
        # Re-raise the exception to be handled by the API endpoint
        raise Exception(f"Failed to delete reading: {str(e)}")


async def delete_all_user_readings_from_db(
    user_id: UUID, client: AsyncClient
) -> DeleteReadingResponse:
    """
    Delete all readings for a user from the database.

    Args:
        user_id: The UUID of the user whose readings are to be deleted.
        client: Authenticated Supabase client instance.

    Returns:
        DeleteReadingResponse with the result of the operation.

    Raises:
        Exception: If the readings cannot be deleted.
    """
    logger.info(f"Deleting all readings for user: {user_id}")

    try:
        # Delete all readings for the user
        delete_response = (
            await client.from_("user_readings")
            .delete()
            .eq("user_id", str(user_id))
            .execute()
        )

        # Check if the operation was successful (data will contain deleted records)
        if delete_response.data is None:  # None means error in this context
            raise Exception("Failed to delete readings")

        count = len(delete_response.data)
        logger.info(f"Successfully deleted {count} readings for user {user_id}")
        return DeleteReadingResponse(
            success=True,
            reading_id=UUID("00000000-0000-0000-0000-000000000000"),  # Placeholder UUID
            user_id=user_id,
            message=f"Successfully deleted {count} readings",
        )

    except Exception as e:
        logger.error(f"Error deleting readings for user {user_id}: {str(e)}")
        # Re-raise the exception to be handled by the API endpoint
        raise Exception(f"Failed to delete readings: {str(e)}")


async def get_reading_by_id(
    user_id: UUID,
    reading_id: UUID,
    client: AsyncClient,
) -> UserReadingResponse | None:
    """
    Fetch a specific reading by ID for a user from the database.

    Args:
        user_id: The UUID of the user whose reading is to be fetched.
        reading_id: The UUID of the reading to fetch.
        client: Authenticated Supabase client instance.

    Returns:
        UserReadingResponse object if found, None otherwise.

    Raises:
        Exception: If the database query fails or reading doesn't belong to user.
    """
    logger.info(f"Fetching reading {reading_id} for user: {user_id}")

    try:
        # Query the user_readings table for the specific reading
        response = (
            await client.from_("user_readings")
            .select(
                "id, user_id, question, mode, language, first_number, second_number, third_number, prediction, clarifying_question, clarifying_answer, created_at"
            )
            .eq("id", str(reading_id))
            .eq("user_id", str(user_id))  # Ensure reading belongs to user
            .single()
            .execute()
        )

        # Check if we have data
        data = response.data
        if not data:
            logger.warning(f"Reading {reading_id} not found for user: {user_id}")
            return None

        # Convert to UserReadingResponse object
        reading = UserReadingResponse.model_validate(data)
        logger.info(f"Successfully fetched reading {reading_id} for user: {user_id}")
        return reading

    except Exception as e:
        logger.error(
            f"Error fetching reading {reading_id} for user {user_id}: {str(e)}"
        )
        # Re-raise the exception to be handled by the API endpoint
        raise Exception(f"Failed to retrieve reading: {str(e)}")
