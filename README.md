# Divination Web App Monorepo

A monorepo project with a NextJS frontend and Python FastAPI backend for I Ching divination.

## Project Structure

```
web-app/
├── apps/                  # Application code
│   ├── frontend/          # NextJS application
│   └── backend/           # Python FastAPI backend
├── docker/                # Dockerfiles
└── .github/               # GitHub workflows
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose (optional, for containerized development)

### Development

#### Using Local Environment

1. Install root dependencies:
   ```
   npm install
   ```

2. Install backend dependencies:
   ```
   cd apps/backend
   pip install -r requirements.txt
   cp .env.example .env
   ```

3. Start development servers:
   ```
   # In the root directory
   npm run dev
   ```

#### Using Docker

```
docker-compose up
```

## Features

- **Frontend**: NextJS, Tailwind CSS, TypeScript
- **Backend**: Python FastAPI with Supabase integration
- **Authentication**: User authentication and quota management
- **Divination**: I Ching text and image generation
- **CI/CD**: GitHub Actions
- **Containerization**: Docker & Docker Compose

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 