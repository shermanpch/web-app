"use client";

import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginCredentials } from '@/types/auth';
import { SuspenseWrapper } from '@/components/ui/suspense-wrapper';
import { usePageState } from '@/hooks/use-page-state';

function SignupContent() {
  const { signUp } = useAuth();
  const { withLoadingState } = usePageState();
  
  const handleSignup = async (credentials: LoginCredentials) => {
    await withLoadingState(async () => {
      await signUp(credentials);
      // Navigation happens in the auth context
    });
  };
  
  return (
    <AuthForm type="signup" onSubmit={handleSignup} />
  );
}

export default function SignupPage() {
  const [_error, _setError] = useState<string | null>(null);
  
  return (
    <AuthLayout title="Create Your Account" error={_error}>
      <SuspenseWrapper>
        <SignupContent />
      </SuspenseWrapper>
    </AuthLayout>
  );
} 