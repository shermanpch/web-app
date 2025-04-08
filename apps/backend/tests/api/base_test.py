"""Base test class for API tests."""

import logging
from typing import Any, Dict

# Get the logger with module name
logger = logging.getLogger(__name__)


class BaseTest:
    """Base test class with common functionality."""

    def setup_method(self, method: Any) -> None:
        """Set up test method."""
        # Initialize the logger here instead of __init__
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"Running test: {method.__name__}")

    def teardown_method(self, method: Any) -> None:
        """Tear down test method."""
        # Ensure logger exists before trying to use it in teardown
        # (though setup_method should always run first in a standard test)
        if hasattr(self, "logger"):
            self.logger.info(f"Finished test: {method.__name__}")

    def assert_has_fields(self, data: Dict[str, Any], fields: list[str]) -> None:
        """Assert that data has all required fields."""
        for field in fields:
            assert field in data, f"Missing field: {field}"
