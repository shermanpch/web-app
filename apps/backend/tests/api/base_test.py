"""Base test class for API tests."""

import logging


class BaseTest:
    """Base class for all test suites."""

    def setup_method(self, method):
        """Set up test method."""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def teardown_method(self, method):
        """Clean up after test method."""
        pass
