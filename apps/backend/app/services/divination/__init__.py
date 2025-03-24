"""Divination package."""

from .iching import (
    get_iching_coordinates_from_oracle,
    get_iching_image_from_bucket,
    get_iching_reading_from_oracle,
    get_iching_text_from_db,
    save_iching_reading_to_db,
    update_iching_reading_in_db,
)
