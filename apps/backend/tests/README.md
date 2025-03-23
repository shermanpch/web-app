# Testing Framework

This folder contains tests for the backend API. The tests are organized into different modules by functionality.

## Test Structure

### Base Test Class
All test classes inherit from `BaseTest` which provides:
- Common utility methods for authentication and token handling
- Hierarchical logging setup with class-specific loggers
- Helper methods for data extraction and validation
- Standardized URL verification utilities

### Fixtures
The `conftest.py` file defines common fixtures, including:
- `client`: A FastAPI test client
- `test_user`: Random test user credentials
- `auth_headers`: Authentication headers with a bearer token
- `auth_tokens`: Both access and refresh tokens for API calls
- `user_cleanup`: Helper for cleaning up test users
- `authenticated_client`: Client with auth headers already set
- `test_logger`: Hierarchical logger for each test

### Logging System
The testing framework implements a hierarchical logging system that:
- Creates loggers following the pattern `tests.module.class_name`
- Outputs logs to both console and a file (`logs/test_run.log`)
- Allows filtering logs by component or test
- Provides context-rich log messages

### Assertion Helpers
The testing framework also includes assertion helper functions:
- `assert_successful_response`: Validates response status and success fields
- `assert_has_fields`: Verifies an object contains required fields

## Test Organization

- `test_auth.py`: Authentication endpoint tests
- `test_divination.py`: I-Ching divination endpoint tests
- `test_api_client.py`: IChingAPIClient integration tests
- `test_quota.py`: User quota management tests

## Test Patterns

All tests follow the AAA (Arrange-Act-Assert) pattern:
1. **Arrange**: Set up the test environment and preconditions
2. **Act**: Perform the action being tested
3. **Assert**: Verify the expected outcomes
4. **Cleanup**: Release resources (done in finally blocks)

## Standardized Helpers

The BaseTest class provides standardized helper methods:

### Authentication Helpers
- `_extract_auth_token`: Extract bearer token from auth headers
- `_extract_tokens`: Extract access and refresh tokens from responses
- `_extract_user_data`: Extract user data from responses

### URL Verification Helpers
- `_verify_image_url_structure`: Validates image URL format and components
- `_verify_image_url_accessibility`: Verifies URL is accessible via HTTP request

## Running the Tests

To run all tests:
```bash
pytest
```

To run a specific test file:
```bash
pytest tests/api/test_auth.py
```

To run a specific test:
```bash
pytest tests/api/test_auth.py::TestAuthentication::test_signup
```

To run integration tests:
```bash
pytest -m integration
```

## Adding New Tests

When adding new tests:
1. Inherit from `BaseTest` class
2. Use the provided fixtures and helper methods
3. Follow the AAA pattern
4. Include proper cleanup in finally blocks
5. Add clear assertions with descriptive error messages
6. Use the hierarchical logger via `self.logger`
7. Leverage standardized helper methods instead of duplicating code

## Test Coverage

The tests cover:

1. **User Signup** - Creating new accounts
2. **User Login** - Authenticating with credentials
3. **Current User** - Getting user information from a token
4. **Token Refresh** - Validating tokens
5. **Password Reset** - Requesting password resets
6. **Password Change** - Updating passwords
7. **Security** - Validation of unauthorized access
8. **Divination API** - I-Ching text and image retrieval
9. **API Client** - Integration tests for the IChingAPIClient
10. **User Quotas** - Quota management and validation

## Requirements

- pytest
- pytest-cov
- fastapi
- httpx

These are automatically installed by the `run_tests.sh` script. 