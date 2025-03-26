"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordForm } from '@/components/auth/password-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/lib/api/endpoints/auth';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Panel } from '@/components/ui/panel';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  // Extract access_token from URL hash fragment
  useEffect(() => {
    const getHashParameters = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      return {
        accessToken: params.get('access_token'),
        refreshToken: params.get('refresh_token'),
        type: params.get('type')
      };
    };

    const { accessToken: token, type } = getHashParameters();
    
    // Only proceed if this is a recovery type and token exists
    if (token && type === 'recovery') {
      setAccessToken(token);
    } else if (!token) {
      setError('Missing access token. Please use the link from your email.');
    } else if (type !== 'recovery') {
      setError('Invalid token type. Please request a new password reset link.');
    }
  }, []);

  const handleResetPassword = async ({ password }: { password: string; confirmPassword: string }) => {
    if (!accessToken) {
      setError('Missing access token. Please use the link from your email.');
      return;
    }

    try {
      await authApi.resetPassword(password, accessToken);
      setSuccess(true);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred while resetting your password.');
    }
  };

  return (
    <AuthLayout title="Reset Password" error={error}>
      {success ? (
        <Panel>
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Password Reset Successful</h2>
            <p className="mb-6">
              Your password has been successfully reset.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </Panel>
      ) : (
        <>
          {accessToken ? (
            <PasswordForm 
              onSubmit={handleResetPassword} 
              submitText="Reset Password" 
            />
          ) : (
            <Panel>
              <div className="p-4">
                <p className="text-center text-sm text-muted-foreground">
                  Invalid or missing access token. Please make sure you're using the correct link from your email.
                </p>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => router.push('/forgot-password')}
                >
                  Request New Link
                </Button>
              </div>
            </Panel>
          )}
        </>
      )}
    </AuthLayout>
  );
} 