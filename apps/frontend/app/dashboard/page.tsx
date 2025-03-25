"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          className="relative z-[200]"
        >
          Logout
        </Button>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 max-w-2xl relative z-[150]">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Welcome, {user?.email || "User"}!</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          You have successfully logged in to the application.
        </p>
        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-md">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">User details:</p>
          <pre className="text-xs text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 p-3 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 