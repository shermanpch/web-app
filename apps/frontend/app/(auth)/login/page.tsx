"use client";

import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginCredentials } from '@/types/auth';
import { SuspenseWrapper } from '@/components/ui/suspense-wrapper';
import { usePageState } from '@/hooks/use-page-state';

function LoginContent() {
  const { signIn } = useAuth();
  const { withLoadingState } = usePageState();
  
  const handleLogin = async (credentials: LoginCredentials) => {
    await withLoadingState(async () => {
      await signIn(credentials);
      // Navigation happens in the auth context
    });
  };
  
  return (
    <AuthForm type="login" onSubmit={handleLogin} />
  );
}

export default function LoginPage() {
  const [_error, _setError] = useState<string | null>(null);
  
  return (
    <AuthLayout title="Welcome Back" error={_error}>
      <SuspenseWrapper>
        <LoginContent />
      </SuspenseWrapper>
    </AuthLayout>
  );
} 