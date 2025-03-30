import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchServerSideUser } from "@/lib/server/authUtils";

// Import components
import LogoutButton from "@/components/auth/logout-button";
import UserDisplay from "./_components/UserDisplay";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Server-side authentication check using cookies()
    let authToken: string | undefined;
    try {
      const cookieStore = await cookies();
      authToken = cookieStore.get("auth_token")?.value;
    } catch (error) {
      console.error("[DashboardLayout] Error accessing cookies:", error);
      authToken = undefined;
    }

    // Double-check auth (Middleware should catch this, but defense-in-depth)
    if (!authToken) {
      console.log("[DashboardLayout] No auth token found server-side, redirecting.");
      redirect('/login?redirectedFrom=/dashboard'); // Or derive path dynamically
    }

    // Fetch user data on the server
    const user = await fetchServerSideUser(authToken);

    // If user fetch fails (e.g., invalid/expired token after middleware check)
    if (!user) {
      console.log("[DashboardLayout] Failed to fetch user server-side, redirecting.");
      // Optionally try a server-side token refresh here if implemented
      redirect('/login');
    }

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
    console.error("[DashboardLayout] Error:", error);
    redirect('/login'); // Fallback to login on any error
  }
}