"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/endpoints/auth";
import { AlertCircle } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.logout(); // Calls backend to invalidate session & clear cookies
    } catch (e) {
      console.error(
        "Logout API call failed, proceeding with client-side redirect.",
        e,
      );
      setError("Logout failed on server. Redirecting...");
    } finally {
      setTimeout(
        () => {
          router.push("/login");
          router.refresh();
        },
        error ? 1500 : 0,
      );
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        onClick={handleLogout}
        size="sm"
        disabled={isLoading}
      >
        {isLoading ? "Logging out..." : "Logout"}
      </Button>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
