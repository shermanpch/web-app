"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginCredentials } from "@/types/auth";
import { SuspenseWrapper } from "@/components/ui/suspense-wrapper";
import { usePageState } from "@/hooks/use-page-state";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/endpoints/auth";
import { useState, useEffect } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/dashboard";
  const errorParam = searchParams.get("error");
  const { withLoadingState, error: apiError, isLoading } = usePageState();
  const [error, setError] = useState<string | null>(apiError);

  // Handle error messages from URL parameters
  useEffect(() => {
    if (errorParam) {
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        invalid_session: "Your session has expired. Please log in again.",
        cookie_error:
          "There was a problem with your browser cookies. Please enable cookies and try again.",
        server_unavailable:
          "The authentication server is currently unavailable. Please try again later.",
        network_error:
          "Network connection issue. Please check your internet connection and try again.",
        unknown_error: "An unexpected error occurred. Please try again.",
      };

      // Set the appropriate error message or a default one
      setError(
        errorMessages[errorParam] ||
          "Authentication error. Please log in again.",
      );
    } else if (apiError) {
      // If there's an API error, use that
      setError(apiError);
    } else {
      setError(null);
    }
  }, [errorParam, apiError]);

  const handleLogin = async (credentials: LoginCredentials) => {
    // Clear any existing error when attempting to log in
    setError(null);

    await withLoadingState(async () => {
      await authApi.login(credentials); // Backend sets cookies via Set-Cookie header
      // Force refresh server components if needed
      router.refresh();
      // Redirect after successful login (cookies are now set)
      router.push(redirectedFrom);
    }, "Login failed. Please check your credentials and try again.");
  };

  return (
    <AuthForm
      type="login"
      onSubmit={handleLogin}
      error={error}
      isLoading={isLoading}
    />
  );
}

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back">
      <SuspenseWrapper>
        <LoginContent />
      </SuspenseWrapper>
    </AuthLayout>
  );
}
