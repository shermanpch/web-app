"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { AuthFormProps } from '@/types/auth';

export function AuthForm({ type, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Submit form - rely on backend validation
      await onSubmit({ email, password });
    } catch (err) {
      // Display error message from backend
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Panel>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {type === 'login' && (
              <Link href="/forgot-password" className="text-sm text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Loading...' : type === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>

        <div className="text-center text-sm mt-4">
          {type === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none">
                Sign up
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <Link href="/login" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}
