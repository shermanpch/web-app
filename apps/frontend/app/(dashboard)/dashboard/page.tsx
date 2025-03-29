"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Panel } from "@/components/ui/panel";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Optional but recommended safety check
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">
          Authentication error. Please login again.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Dashboard
        </h1>
      </div>

      <Panel className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--foreground))]">
          Welcome, {user?.email || "User"}!
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          You have successfully logged in to the application.
        </p>
        {user && (
          <div className="p-4 bg-[hsl(var(--muted))] rounded-md">
            <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              User details:
            </p>
            <pre className="text-xs text-[hsl(var(--foreground))] bg-[hsl(var(--muted)/70)] p-3 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </Panel>
    </div>
  );
}
