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
- Supabase account (for authentication and database)

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

3. Set up Supabase environment variables:
   ```
   # In apps/frontend directory
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start development servers:
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

## Authentication Features

The application uses Supabase for authentication with the following features:

- Email/password authentication
- Password reset via email
- Session management
- User profiles and quota tracking

### Password Reset Flow

The password reset flow works as follows:

1. User requests a password reset by email
2. User receives an email with a magic link containing a recovery token
3. The magic link redirects to the reset password page with a URL hash containing `#access_token=xxx&type=recovery`
4. The Supabase client automatically processes the recovery token to restore the user session
5. We listen for auth state changes with `onAuthStateChange` to get a valid session
6. User sets a new password which is sent to the backend with the valid session token

### How Supabase Recovery Tokens Work

Supabase recovery tokens have some special characteristics:

1. The URL contains `#access_token=xxx&type=recovery` in the URL hash
2. The token is **not** a full session token initially and cannot be used directly
3. Supabase's client automatically processes this token when the page loads
4. When using the React SDK, you should listen for auth state changes via `onAuthStateChange`
5. This event will fire with a valid session after Supabase processes the recovery token

## Troubleshooting

### Password Reset Issues

If you encounter issues with the password reset flow:

1. **"Invalid or expired reset link" error**:
   - Ensure your Supabase environment variables are correctly set in `.env.local`
   - Check that your Supabase project has Email Auth enabled in the Authentication settings
   - Verify that the redirect URL in Supabase matches your application URL followed by `/reset-password`
   - The reset link is valid for 24 hours by default

2. **Recovery token handling**:
   - The app expects the recovery token in the URL hash parameter format: `#access_token=xxx&type=recovery`
   - The recovery token must be processed by Supabase's client to obtain a valid session
   - Use `supabase.auth.onAuthStateChange()` to listen for when the session is ready

3. **If the token doesn't automatically convert to a session**:
   - Make sure you're not redirecting away from the reset-password page too quickly
   - Check console logs for any Supabase errors
   - Ensure your browser supports localStorage (for Supabase to store the session)

### Redirect URL Settings

For password reset to work properly, configure these settings in Supabase:

1. Navigate to Authentication → URL Configuration
2. Set Site URL: `http://localhost:3000` (for local development)
3. Add Redirect URLs:
   - `http://localhost:3000/reset-password`
   - `http://localhost:3000/login`
   - `https://your-production-domain.com/reset-password` (for production)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 