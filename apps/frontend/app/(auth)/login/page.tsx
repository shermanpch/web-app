"use client";

import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginCredentials } from '@/types/auth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      await signIn(credentials);
      // Navigation happens in the auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login. Please try again.');
    }
  };
  
  return (
    <AuthLayout title="Welcome Back" error={error}>
      <AuthForm type="login" onSubmit={handleLogin} />
    </AuthLayout>
  );
} 