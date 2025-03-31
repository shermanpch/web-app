"use client";

import React from "react";

// Accept email as a prop
export default function UserDisplay({ email }: { email: string | null }) {
  // No need for isLoading or useAuth anymore for this basic display
  if (!email) {
    // Handle case where email might be null unexpectedly
    return (
      <span className="text-sm text-[hsl(var(--muted-foreground))]">User</span>
    );
  }

  return <span className="text-sm text-[hsl(var(--foreground))]">{email}</span>;
}
