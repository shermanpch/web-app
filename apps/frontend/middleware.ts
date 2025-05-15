import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Define route patterns for protected and public routes
 */
const protectedRoutes = ["/try-now", "/profile", "/readings", "/settings"]; // Regex pattern for dashboard and subpaths
const publicAuthRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Middleware to handle authentication, redirection, or any custom logic
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const authTokenCookie = request.cookies.get("auth_token");
  const refreshTokenCookie = request.cookies.get("refresh_token");
  const authToken = authTokenCookie?.value;

  // Check if the current path matches any protected route pattern
  const isProtectedRoute = protectedRoutes.some((route) => {
    const regex = new RegExp(`^${route}$`);
    return regex.test(pathname);
  });

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute) {
    if (!authToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // New validation logic
    try {
      const backendApiUrl = process.env.INTERNAL_BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!backendApiUrl) {
        console.error("Backend API URL is not configured.");
        // Fallback or error handling: For now, let's redirect to login as a safe default
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectedFrom", pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      let cookieHeader = "";
      if (authTokenCookie) {
        cookieHeader += `auth_token=${authTokenCookie.value}; `;
      }
      if (refreshTokenCookie) {
        cookieHeader += `refresh_token=${refreshTokenCookie.value};`;
      }

      const validationResponse = await fetch(`${backendApiUrl}/api/auth/validate-token`, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader.trim()
        },
      });

      if (!validationResponse.ok) {
        // Token is invalid or other error occurred
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectedFrom", pathname);
        // Clear potentially invalid cookies before redirecting
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('auth_token');
        response.cookies.delete('refresh_token');
        return response;
      }
      // Token is valid, proceed
    } catch (error) {
      console.error('Middleware token validation error:', error);
      // Network error or other issue, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users trying to access login/register
  if (authToken && publicAuthRoutes.includes(pathname)) {
    // Before redirecting, validate token to prevent redirect loops if token is bad
    try {
      const backendApiUrl = process.env.INTERNAL_BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL;
      let cookieHeader = "";
      if (authTokenCookie) {
        cookieHeader += `auth_token=${authTokenCookie.value}; `;
      }
      if (refreshTokenCookie) {
        cookieHeader += `refresh_token=${refreshTokenCookie.value};`;
      }

      if (backendApiUrl && cookieHeader) { // only validate if URL and cookies exist
        const validationResponse = await fetch(`${backendApiUrl}/api/auth/validate-token`, {
          method: 'GET',
          headers: { 'Cookie': cookieHeader.trim() },
        });
        if (validationResponse.ok) {
          return NextResponse.redirect(new URL("/try-now", request.url));
        }
        // if token not ok, don't redirect, let them stay on login/register
      }
    } catch (e) {
      // if validation fails, don't redirect, let them stay on login/register
      console.error('Error validating token for publicAuthRoutes redirect:', e);
    }
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
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/try-now",
    // Exclude static files, API routes etc.
    "/((?!api|_next/static|_next/image|favicon.ico|assets/.*\\..*).*)",
  ],
};
