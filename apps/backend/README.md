# Backend API for Web App

This project contains the FastAPI backend for the Web App, with a focus on I Ching divination services.

## Project Structure

The project follows a domain-driven design approach with clear separation of concerns:

```
apps/backend/
├── main.py                      # Application entry point
├── app/                         # Main application package
│   ├── __init__.py              # Package initialization
│   ├── config.py                # Application configuration
│   ├── api/                     # API layer
│   │   ├── router.py            # Main API router
│   │   └── endpoints/           # Endpoint handlers by domain
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── divination.py    # Divination endpoints 
│   │       ├── health.py        # Health check endpoints
│   │       └── user.py          # User endpoints
│   ├── models/                  # Data models
│   │   ├── auth.py              # Authentication models
│   │   ├── divination.py        # Divination models
│   │   └── users.py             # User models (including quota)
│   ├── services/                # Service layer (business logic)
│   │   ├── auth/                # Authentication services
│   │   │   ├── dependencies.py  # Auth dependencies
│   │   │   └── supabase.py      # Supabase auth client
│   │   ├── divination/          # Divination services
│   │   │   └── iching.py        # I Ching divination logic
│   │   └── users/               # User services
│   │       └── quota.py         # User quota management
│   └── utils/                   # Utility functions
│       └── clients/             # External API clients
│           └── api_client.py    # I Ching API client
└── tests/                       # Test suite
    ├── conftest.py              # Test configuration and fixtures
    └── api/                     # API tests
        ├── base_test.py         # Base test class
        ├── test_auth.py         # Authentication tests
        ├── test_divination.py   # Divination tests
        ├── test_api_client.py   # API client tests
        └── test_quota.py        # User quota tests
```

## Main Components

- **API Layer (`app/api/`)**: Handles HTTP requests and responses, with endpoints grouped by domain.
- **Models (`app/models/`)**: Pydantic models for request/response validation and data schemas.
- **Services (`app/services/`)**: Business logic organized by domain.
- **Core (`app/core/`)**: Core application logic, including the Oracle engine.
- **Utils (`app/utils/`)**: Utility functions and external API clients.

## API Design Principles

This project follows a model-based API design approach:

- **Model-Driven Development**: All API endpoints use Pydantic models for request and response handling
- **Standardized Request/Response**: Request bodies contain all parameters (auth tokens, query parameters, etc.)
- **HTTP Method Usage**: 
  - POST for all operations that require a request body 
  - GET only for simple queries without complex parameters
- **Error Handling**: Consistent error responses with appropriate HTTP status codes
- **API Versioning**: API endpoints follow a consistent `/api/{domain}/{operation}` structure

## Logging

The application uses a hierarchical logging approach:

- Module-based naming: `logging.getLogger(__name__)` in every module
- Consistent log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Structured format: timestamp, logger name, level, message
- Test logging: Separate loggers for tests with detailed context

## Configuration

Configuration is managed through environment variables defined in `.env` file:

```
# FastAPI settings
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Supabase configuration
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-api-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI configuration (if applicable)
OPENAI_API_KEY=your-openai-api-key

# Testing configuration
TEST_EMAIL=your-test-email@example.com
```

## Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py

# Or use uvicorn directly
uvicorn main:app --reload
```

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

Tests are organized in the `tests/` directory, with a similar structure to the application:

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app

# Run specific test categories
pytest tests/api/test_auth.py
pytest tests/api/test_divination.py
```

### Test Structure

Tests follow a consistent pattern:

- **Arrange**: Set up test data and prerequisites
- **Act**: Call the API or function under test
- **Assert**: Verify the results and side effects
- **Cleanup**: Remove any resources created during the test

### Test Fixtures

Reusable test components are defined as fixtures in `conftest.py`:

- `client`: FastAPI test client
- `test_user`: Test user credentials
- `auth_tokens`: Authentication tokens for a test user
- `user_cleanup`: Function to clean up test users

## Contributing

When developing new endpoints, follow these guidelines:

1. Create appropriate Pydantic models in the `app/models/` directory
2. Implement service logic in the `app/services/` directory
3. Add API endpoints in the `app/api/endpoints/` directory
4. Use consistent error handling and response formats
5. Write tests for all new functionality
6. Follow existing coding standards and patterns
