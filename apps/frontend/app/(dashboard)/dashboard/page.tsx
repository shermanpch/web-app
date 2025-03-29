"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { Panel } from "@/components/ui/panel";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useRequireAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // If not authenticated, don't render anything - just return null
  // The useEffect will handle the redirect
  if (!isAuthenticated || !user) {
    return null;
  }

  // Only render dashboard content if authenticated
  return (
    <div className="flex flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Dashboard
        </h1>
      </div>

      <Panel className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--foreground))]">
          Welcome, {user.email || "User"}!
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          You have successfully logged in to the application.
        </p>
        <div className="p-4 bg-[hsl(var(--muted))] rounded-md">
          <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
            User details:
          </p>
          <pre className="text-xs text-[hsl(var(--foreground))] bg-[hsl(var(--muted)/70)] p-3 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </Panel>
    </div>
  );
}
