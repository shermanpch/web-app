"""Base test class for API tests."""

import asyncio
import logging
from typing import Any


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

        # Clean up any pending tasks in the event loop
        try:
            loop = asyncio.get_event_loop()
            if not loop.is_closed():
                tasks: list[asyncio.Task] = [
                    t for t in asyncio.all_tasks(loop) if not t.done()
                ]
                if tasks:
                    for task in tasks:
                        task.cancel()
        except RuntimeError:
            # Event loop might already be closed or not set
            pass
