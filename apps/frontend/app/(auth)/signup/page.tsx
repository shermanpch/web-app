"use client";

import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginCredentials } from '@/types/auth';
import { SuspenseWrapper } from '@/components/ui/suspense-wrapper';
import { usePageState } from '@/hooks/use-page-state';

function SignupContent() {
  const { signUp } = useAuth();
  const { withLoadingState, error, isLoading } = usePageState();
  
  const handleSignup = async (credentials: LoginCredentials) => {
    await withLoadingState(async () => {
      await signUp(credentials);
      // Navigation happens in the auth context
    }, 'Signup failed. Please try again or use a different email.');
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