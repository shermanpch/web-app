"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { LoginCredentials } from "@/types/auth";
import { SuspenseWrapper } from "@/components/ui/suspense-wrapper";
import { usePageState } from "@/hooks/use-page-state";

function LoginContent() {
  const { signIn } = useAuth();
  const { withLoadingState, error, isLoading } = usePageState();

  const handleLogin = async (credentials: LoginCredentials) => {
    await withLoadingState(async () => {
      await signIn(credentials);
      // Navigation happens in the auth context
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
