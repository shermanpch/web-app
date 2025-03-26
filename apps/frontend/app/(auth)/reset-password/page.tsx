"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordForm } from '@/components/auth/password-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/lib/api/endpoints/auth';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { SuspenseWrapper } from '@/components/ui/suspense-wrapper';
import { usePageState } from '@/hooks/use-page-state';

function ResetPasswordContent() {
  const [success, setSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { withLoadingState, setError } = usePageState();
  
  // Process token just once on component mount
  useEffect(() => {
    // Get token from either hash or query params
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const hashToken = hashParams.get('access_token');
    
    const queryToken = searchParams.get('token') || searchParams.get('access_token');
    
    // Use the token from the appropriate source
    const token = hashToken || queryToken;
    
    if (token) {
      setAccessToken(token);
    } else {
      setError('Missing access token. Please use the link from your email.');
    }
  }, [searchParams, setError]);

  const handleResetPassword = async ({ password }: { password: string; confirmPassword: string }) => {
    if (!accessToken) {
      setError('Missing access token. Please use the link from your email.');
      return;
    }

    await withLoadingState(async () => {
      await authApi.resetPassword(password, accessToken);
      setSuccess(true);
    });
  };

  // Show success view
  if (success) {
    return (
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
    );
  }
  
  // Show password form if token exists, otherwise show error
  return (
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
              Invalid or missing access token. Please make sure you&apos;re using the correct link from your email.
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
  );
}

export default function ResetPasswordPage() {
  const [_error, _setError] = useState<string | null>(null);
  
  return (
    <AuthLayout title="Reset Password" error={_error}>
      <SuspenseWrapper>
        <ResetPasswordContent />
      </SuspenseWrapper>
    </AuthLayout>
  );
} 