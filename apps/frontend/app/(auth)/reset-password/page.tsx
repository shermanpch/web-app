"use client";

import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/lib/auth/auth-context';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const { changePassword } = useAuth();
  const searchParams = useSearchParams();
  
  const accessToken = searchParams.get('token') || '';
  const refreshToken = searchParams.get('refresh_token') || '';
  
  const handleChangePassword = async ({ password }: { password: string }) => {
    await changePassword(password, accessToken, refreshToken);
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-white dark:bg-slate-900">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">Set New Password</h1>
        <AuthForm 
          type="reset-password" 
          onSubmit={handleChangePassword}
          accessToken={accessToken}
          refreshToken={refreshToken}
        />
      </div>
    </div>
  );
} 