"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/lib/api/endpoints/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.requestPasswordReset(email);
      // Show success message
      window.alert("If an account exists, a reset email has been sent.");
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" error={error}>
      <Panel>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center text-sm mt-4">
            <Button 
              variant="link" 
              onClick={() => router.push('/login')} 
              className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none"
            >
              Back to Login
            </Button>
          </div>
        </form>
      </Panel>
    </AuthLayout>
  );
} 