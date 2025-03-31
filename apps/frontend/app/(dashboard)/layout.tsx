import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchServerSideUser } from "@/lib/server/authUtils";
import { User } from "@/types/auth";

// Import components
import LogoutButton from "@/components/auth/logout-button";
import UserDisplay from "./_components/UserDisplay";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let authToken: string | undefined;
  let user: User | null = null;
  let fetchError: string | null = null;

  try {
    // Server-side authentication check using cookies()
    try {
      const cookieStore = await cookies();
      authToken = cookieStore.get("auth_token")?.value;
    } catch (error) {
      console.error(
        "[DashboardLayout] Critical error accessing cookies:",
        error,
      );
      // If cookies cannot be accessed at all, redirect immediately
      redirect("/login?error=cookie_error");
    }

    // Double-check auth (Middleware should catch this, but defense-in-depth)
    if (!authToken) {
      console.log(
        "[DashboardLayout] No auth token found server-side, redirecting.",
      );
      redirect("/login?redirectedFrom=/dashboard"); // Or derive path dynamically
    }

    // Fetch user data on the server
    try {
      user = await fetchServerSideUser(authToken);
    } catch (error) {
      // Catch errors specifically from the fetch function itself (e.g., network)
      console.error(
        "[DashboardLayout] Network or unexpected error fetching server-side user:",
        error,
      );
      fetchError = "server_unavailable"; // Mark the error type
    }

    // Handle different failure scenarios AFTER fetching
    if (fetchError === "server_unavailable") {
      // Redirect or render an error page if the API call failed fundamentally
      redirect(`/login?error=${fetchError}`);
    } else if (!user) {
      // User is null, likely invalid/expired token even after potential backend refresh
      console.log(
        "[DashboardLayout] Failed to fetch user server-side (null user), redirecting.",
      );
      redirect("/login?error=invalid_session");
    }

    // --- If we reach here, user is authenticated and fetched ---
    const navItems = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/divination", label: "Divination" },
      { href: "/dashboard/change-password", label: "Change Password" },
    ];

    return (
      <div className="min-h-screen flex flex-col">
        <nav className="bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] p-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <UserDisplay email={user.email} />
              <LogoutButton />
            </div>
          </div>
        </nav>
        <main className="flex-grow">{children}</main>
      </div>
    );
  } catch (error) {
    // Fallback error handler for any uncaught errors
    console.error("[DashboardLayout] Unhandled error:", error);

    // Try to provide more context in the redirect based on error type
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNetworkRelated =
      errorMessage.toLowerCase().includes("network") ||
      errorMessage.toLowerCase().includes("fetch") ||
      errorMessage.toLowerCase().includes("connection");

    if (isNetworkRelated) {
      redirect("/login?error=network_error");
    } else {
      redirect("/login?error=unknown_error");
    }
  }
}
