"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginCredentials } from "@/types/auth";
import { SuspenseWrapper } from "@/components/ui/suspense-wrapper";
import { usePageState } from "@/hooks/use-page-state";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/endpoints/auth";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/dashboard";
  const { withLoadingState, error, isLoading } = usePageState();

  const handleSignup = async (credentials: LoginCredentials) => {
    await withLoadingState(async () => {
      await authApi.signup(credentials); // Backend sets cookies via Set-Cookie header
      // Force refresh server components if needed
      router.refresh();
      // Redirect after successful signup (cookies are now set)
      router.push(redirectedFrom);
    }, "Signup failed. Please try again or use a different email.");
  };

  return (
    <AuthForm
      type="signup"
      onSubmit={handleSignup}
      error={error}
      isLoading={isLoading}
    />
  );
}

export default function SignupPage() {
  return (
    <AuthLayout title="Create Your Account">
      <SuspenseWrapper>
        <SignupContent />
      </SuspenseWrapper>
    </AuthLayout>
  );
}
