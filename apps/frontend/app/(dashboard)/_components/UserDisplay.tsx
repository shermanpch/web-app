"use client"; // IMPORTANT: Mark as a Client Component

import React from "react";
import { useAuth } from "@/lib/auth/auth-context";

export default function UserDisplay() {
  const { user, isLoading } = useAuth(); // Get state from AuthProvider

  if (isLoading) {
    // Display a loading state matching the layout style
    return (
      <span className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">
        Loading...
      </span>
    );
  }

  // Display the user's email from the context, or a fallback
  return (
    <span className="text-sm text-[hsl(var(--foreground))]">
      {user?.email || "User"}
    </span>
  );
}
