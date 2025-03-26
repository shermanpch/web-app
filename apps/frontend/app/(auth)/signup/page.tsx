"use client";

import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginCredentials } from '@/types/auth';

export default function SignupPage() {
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const handleSignup = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      await signUp(credentials);
      // Navigation happens in the auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup. Please try again.');
    }
  };
  
  return (
    <AuthLayout title="Create Your Account" error={error}>
      <AuthForm type="signup" onSubmit={handleSignup} />
    </AuthLayout>
  );
} 