"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/lib/api/endpoints/auth';
import { SuspenseWrapper } from '@/components/ui/suspense-wrapper';
import { usePageState } from '@/hooks/use-page-state';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  
  const { isLoading, withLoadingState } = usePageState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await withLoadingState(async () => {
      await authApi.requestPasswordReset(email);
      setIsSuccess(true);
    }, 'Password reset request failed', true);
  };

  return (
    <Panel>
      {isSuccess ? (
        <div className="text-center space-y-4 py-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Check Your Email</h2>
          <p className="mb-4">
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Please check your email inbox and spam folder. The reset link is valid for 24 hours.
          </p>
          <Button
            variant="outline" 
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Return to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center text-sm mt-4">
            <Button 
              variant="link" 
              onClick={() => router.push('/login')} 
              className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}

export default function ForgotPasswordPage() {
  const [_error, _setError] = useState<string | null>(null);
  
  return (
    <AuthLayout title="Forgot Password" error={_error}>
      <SuspenseWrapper variant="compact">
        <ForgotPasswordContent />
      </SuspenseWrapper>
    </AuthLayout>
  );
} 