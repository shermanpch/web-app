# Backend Service

A FastAPI backend service for the Divination web application.

## Features

- User authentication with Supabase
- I Ching text divination
- User quota management
- Reading history

## Getting Started

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment variables and configure them
cp .env.example .env
```

### Development

```bash
# Start the development server
python3 main.py
```

This will start the server at http://localhost:8000

## API Documentation

Once running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
src/
├── api/                # API endpoints
│   ├── endpoints/      # Route handlers
│   └── router.py       # API router
├── auth/               # Authentication logic
│   ├── dependencies.py # Auth middleware
│   └── supabase.py     # Supabase integration
├── divination/         # Divination logic
│   ├── iching.py       # I Ching divination
│   └── quota.py        # User quota management
├── models/             # Data models
│   ├── auth.py         # Auth models
│   ├── divination.py   # Divination models
│   ├── quota.py        # Quota models
│   └── readings.py     # User reading models
└── config.py           # Configuration
```

## Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=src
```
