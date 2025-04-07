"""Service functions for user readings."""

import logging
from typing import List
from uuid import UUID

from ...models.users import DeleteReadingResponse, UserReadingResponse
from ...services.auth.supabase import get_authenticated_client

# Create logger
logger = logging.getLogger(__name__)


async def get_user_readings_from_db(
    user_id: UUID, access_token: str, refresh_token: str, page: int = 1, limit: int = 10
) -> List[UserReadingResponse]:
    """
    Fetch paginated historical readings for a specific user from the database.

    Args:
        user_id: The UUID of the user whose readings are to be fetched.
        access_token: User's access token.
        refresh_token: User's refresh token.
        page: The page number (1-indexed).
        limit: The number of readings per page.

    Returns:
        A list of UserReadingResponse objects for the requested page, ordered by creation date descending.

    Raises:
        Exception: If the database query fails.
    """
    logger.info(f"Fetching readings for user: {user_id} (page: {page}, limit: {limit})")

    try:
        # Get authenticated Supabase client
        logger.debug("Using authenticated client with user tokens")
        client = await get_authenticated_client(access_token, refresh_token)

        # Calculate offset from page and limit
        offset = (page - 1) * limit

        # Query the user_readings table with pagination
        response = (
            await client.table("user_readings")
            .select(
                "id, user_id, question, first_number, second_number, third_number, language, prediction, clarifying_question, clarifying_answer, created_at"
            )
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)  # Order by most recent first
            .range(offset, offset + limit - 1)  # Apply pagination
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data:
            logger.info(f"No readings found for user: {user_id} on page {page}")
            return []

        # Convert list of dicts to list of UserReadingResponse objects
        # Pydantic v2 handles ORM mode automatically with model_config
        readings = [UserReadingResponse.model_validate(item) for item in data]
        logger.info(
            f"Found {len(readings)} readings for user: {user_id} on page {page}"
        )
        return readings

    except Exception as e:
        logger.error(f"Error fetching user readings for {user_id}: {str(e)}")
        # Re-raise the exception to be handled by the API endpoint
        raise Exception(f"Failed to retrieve user readings: {str(e)}")


async def delete_user_reading_from_db(
    user_id: UUID, reading_id: UUID, access_token: str, refresh_token: str
) -> DeleteReadingResponse:
    """
    Delete a specific reading for a user from the database.

    Args:
        user_id: The UUID of the user whose reading is to be deleted.
        reading_id: The UUID of the reading to delete.
        access_token: User's access token.
        refresh_token: User's refresh token.

    Returns:
        DeleteReadingResponse with the result of the operation.

    Raises:
        Exception: If the reading doesn't exist or cannot be deleted.
    """
    logger.info(f"Deleting reading {reading_id} for user: {user_id}")

    try:
        # Get authenticated Supabase client
        client = await get_authenticated_client(access_token, refresh_token)

        # First verify the reading belongs to the user
        verify_response = (
            await client.table("user_readings")
            .select("id")
            .eq("id", str(reading_id))
            .eq("user_id", str(user_id))
            .execute()
        )

        if not verify_response.data:
            logger.warning(f"Reading {reading_id} not found for user {user_id}")
            raise Exception(f"Reading not found or does not belong to the user")

        # Delete the reading
        delete_response = (
            await client.table("user_readings")
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
    user_id: UUID, access_token: str, refresh_token: str
) -> DeleteReadingResponse:
    """
    Delete all readings for a user from the database.

    Args:
        user_id: The UUID of the user whose readings are to be deleted.
        access_token: User's access token.
        refresh_token: User's refresh token.

    Returns:
        DeleteReadingResponse with the result of the operation.

    Raises:
        Exception: If the readings cannot be deleted.
    """
    logger.info(f"Deleting all readings for user: {user_id}")

    try:
        # Get authenticated Supabase client
        client = await get_authenticated_client(access_token, refresh_token)

        # Delete all readings for the user
        delete_response = (
            await client.table("user_readings")
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
