import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Define route patterns for protected and public routes
 */
const protectedRoutes = ['/dashboard', '/dashboard/(.*)'];  // Regex pattern for dashboard and subpaths
const publicAuthRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * Middleware to handle authentication, redirection, or any custom logic
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const authToken = request.cookies.get("auth_token")?.value;

  // Check if the current path matches any protected route pattern
  const isProtectedRoute = protectedRoutes.some(route => {
    const regex = new RegExp(`^${route}$`);
    return regex.test(pathname);
  });

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    console.log(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login.`);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users trying to access login/signup
  if (authToken && publicAuthRoutes.includes(pathname)) {
    console.log(`[Middleware] Authenticated user accessing ${pathname}, redirecting to dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Continue normally for all other cases
  return NextResponse.next();
}

/**
 * Middleware config to exclude paths like API routes or static files
 */
export const config = {
  matcher: [
    // Apply middleware to these paths
    '/dashboard/:path*',
    '/dashboard',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    // Exclude static files, API routes etc.
    '/((?!api|_next/static|_next/image|favicon.ico|assets/.*\\..*).*)',
  ],
};
