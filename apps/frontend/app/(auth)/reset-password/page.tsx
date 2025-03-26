"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/lib/api/endpoints/auth';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Extract token from URL hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const token = new URLSearchParams(hash).get('access_token');
      
      if (!token) {
        setError("Invalid or expired reset link");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setAccessToken(token);
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password requirements (e.g., length)
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!accessToken) {
      setError("Missing access token. Please try the reset link again.");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(password, accessToken);
      
      // Show success message
      window.alert("Your password has been updated. Please log in with your new password.");
      
      router.push('/login');
    } catch (err) {
      console.error('Reset password error:', err);
      
      // Provide a more detailed error message
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null) {
        setError(JSON.stringify(err));
      } else {
        setError('An unexpected error occurred during password reset');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" error={error}>
      <Panel>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || !accessToken}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || !accessToken}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !accessToken}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
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