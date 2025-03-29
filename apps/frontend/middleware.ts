import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Define route patterns for protected and public routes
 */
const protectedRoutes = ["/dashboard", "/dashboard/:path*"];
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/**
 * Middleware to handle authentication, redirection, or any custom logic
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const authToken = request.cookies.get("auth_token")?.value;

  // Check if the current path matches any protected route pattern
  const isProtectedRoute = protectedRoutes.some((route) => {
    // Convert route pattern with :path* to regex
    const routePattern = route.replace(":path*", ".*");
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(pathname);
  });

  // If trying to access a protected route without auth token, redirect to login
  if (isProtectedRoute && !authToken) {
    const url = new URL("/login", request.url);
    // Add the redirectedFrom query parameter to enable redirect after login
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Optional: If already authenticated and trying to access login/signup pages,
  // redirect to dashboard
  if (authToken && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Continue normally for all other cases
  return NextResponse.next();
}

/**
 * Middleware config to exclude paths like API routes or static files
 */
export const config = {
  matcher: [
    // Include all pages that need middleware processing
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/dashboard",
    "/dashboard/:path*",

    // Exclude specific paths that should be bypassed
    "/((?!api|_next/static|_next/image|favicon.ico|assets/|.*\\..*).*)",
  ],
};
