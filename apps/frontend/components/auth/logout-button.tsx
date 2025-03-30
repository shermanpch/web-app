"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/endpoints/auth";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout(); // Calls backend to invalidate session & clear cookies
    } catch (e) {
      console.error("Logout API call failed, proceeding with client-side redirect.", e);
      // Even if API fails, we proceed with redirection to login
    } finally {
      // Always redirect to login regardless of API success
      router.push('/login');
      router.refresh(); // Ensure full state reset
      setIsLoading(false);
    }
  };

  return (
    <Button variant="destructive" onClick={handleLogout} size="sm" disabled={isLoading}>
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
