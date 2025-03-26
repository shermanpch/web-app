"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, signOut, navigationState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to login if:
    // 1. Not authenticated and not loading
    // 2. Not in the middle of a navigation operation that allows unauthenticated access
    const allowUnauthenticatedAccess = navigationState?.allowUnauthenticatedAccess || false;
    
    if (!isAuthenticated && !isLoading && !allowUnauthenticatedAccess) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, navigationState, router]);

  const handleLogout = () => {
    console.log("Logging out...");
    signOut();
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // If we get here, user should be authenticated
  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="flex justify-between items-center mb-8 relative z-[200]">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          className="relative z-[200]"
        >
          Logout
        </Button>
      </div>
      
      <Panel className="max-w-2xl relative z-[150]">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--foreground))]">Welcome, {user?.email || "User"}!</h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          You have successfully logged in to the application.
        </p>
        <div className="p-4 bg-[hsl(var(--muted))] rounded-md">
          <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">User details:</p>
          <pre className="text-xs text-[hsl(var(--foreground))] bg-[hsl(var(--muted)/70)] p-3 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </Panel>
    </div>
  );
} 