"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to login if not authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    console.log("Logging out...");
    // Reset auth state and immediately navigate
    await signOut();
    router.replace("/");
  };

  const handleChangePassword = () => {
    router.push("/dashboard/change-password");
  };

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
    <div className="flex min-h-screen flex-col p-8">
      <div className="flex justify-between items-center mb-8 relative z-[200]">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleChangePassword} 
            className="relative z-[200]"
          >
            Change Password
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLogout} 
            className="relative z-[200]"
          >
            Logout
          </Button>
        </div>
      </div>
      
      <Panel className="max-w-2xl relative z-[150]">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--foreground))]">Welcome, {user.email || "User"}!</h2>
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