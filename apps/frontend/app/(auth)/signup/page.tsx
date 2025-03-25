"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginCredentials } from '@/types/auth';

export default function SignupPage() {
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const handleSignup = async ({ email, password }: LoginCredentials) => {
    try {
      setError(null);
      await signUp(email, password);
      // After successful signup, the user will be redirected to the login page
      // This happens in the auth context's signUp function
    } catch (err) {
      // Display error from backend
      setError(err instanceof Error ? err.message : 'An error occurred during signup. Please try again.');
    }
  };
  
  return (
    <AuthLayout title="Create Your Account" error={error}>
      <AuthForm type="signup" onSubmit={handleSignup} />
    </AuthLayout>
  );
} 