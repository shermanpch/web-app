"""Service functions for user readings."""

import logging
from typing import List
from uuid import UUID

from ...models.users import UserReadingResponse
from ...services.auth.supabase import get_authenticated_client

# Create logger
logger = logging.getLogger(__name__)


async def get_user_readings_from_db(
    user_id: UUID, access_token: str, refresh_token: str
) -> List[UserReadingResponse]:
    """
    Fetch all historical readings for a specific user from the database.

    Args:
        user_id: The UUID of the user whose readings are to be fetched.
        access_token: User's access token.
        refresh_token: User's refresh token.

    Returns:
        A list of UserReadingResponse objects, ordered by creation date descending.

    Raises:
        Exception: If the database query fails.
    """
    logger.info(f"Fetching readings for user: {user_id}")

    try:
        # Get authenticated Supabase client
        logger.debug("Using authenticated client with user tokens")
        client = await get_authenticated_client(access_token, refresh_token)

        # Query the user_readings table
        response = (
            await client.table("user_readings")
            .select(
                "id, user_id, question, first_number, second_number, third_number, language, prediction, clarifying_question, clarifying_answer, created_at"
            )
            .eq(
                "user_id", str(user_id)
            )  # Filter by user_id (ensure it's string for Supabase)
            .order("created_at", desc=True)  # Order by most recent first
            .execute()
        )

        # Check if we have any data
        data = response.data
        if not data:
            logger.info(f"No readings found for user: {user_id}")
            return []

        # Convert list of dicts to list of UserReadingResponse objects
        # Pydantic v2 handles ORM mode automatically with model_config
        readings = [UserReadingResponse.model_validate(item) for item in data]
        logger.info(f"Found {len(readings)} readings for user: {user_id}")
        return readings

    except Exception as e:
        logger.error(f"Error fetching user readings for {user_id}: {str(e)}")
        # Re-raise the exception to be handled by the API endpoint
        raise Exception(f"Failed to retrieve user readings: {str(e)}")
