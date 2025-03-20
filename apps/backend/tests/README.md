# Authentication Tests

This directory contains tests for the authentication system.

## Test Structure

- `conftest.py` - Contains shared test fixtures
- `api/test_auth.py` - Tests for the authentication endpoints

## Running Tests

You can run the tests with:

```bash
# From the backend directory
./tests/run_tests.sh
```

Or manually with:

```bash
pytest -xvs tests/api/test_auth.py
```

## Test Coverage

The tests cover:

1. **User Signup** - Creating new accounts
2. **User Login** - Authenticating with credentials
3. **Current User** - Getting user information from a token
4. **Token Refresh** - Validating tokens
5. **Password Reset** - Requesting password resets
6. **Password Change** - Updating passwords
7. **Security** - Validation of unauthorized access

## Requirements

- pytest
- pytest-cov
- fastapi
- httpx

These are automatically installed by the `run_tests.sh` script. 