import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle authentication, redirection, or any custom logic
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Example: get auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value;

  // TODO: Add route protection or redirect logic here

  return NextResponse.next(); // continue normally
}

/**
 * Middleware config to exclude paths like API routes or static files
 */
export const config = {
  matcher: [
    // Exclude paths like: /api/*, /_next/static/*, /favicon.ico, image files, etc.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
