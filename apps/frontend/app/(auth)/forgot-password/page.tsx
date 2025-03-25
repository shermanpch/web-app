"use client";

import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/lib/auth/auth-context';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  
  const handleResetPassword = async ({ email }: { email: string }) => {
    await resetPassword(email);
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-white dark:bg-slate-900">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">Reset Your Password</h1>
        <AuthForm type="forgot-password" onSubmit={handleResetPassword} />
      </div>
    </div>
  );
} 