"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginCredentials } from "@/types/auth";
import { SuspenseWrapper } from "@/components/ui/suspense-wrapper";
import { usePageState } from "@/hooks/use-page-state";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/endpoints/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard';
  const { withLoadingState, error, isLoading } = usePageState();

  const handleLogin = async (credentials: LoginCredentials) => {
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
