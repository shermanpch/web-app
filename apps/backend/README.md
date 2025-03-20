# Backend Service

A FastAPI backend service for the web-app project.

## Getting Started

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
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
├── models/             # Data models
└── config.py           # Configuration
```
