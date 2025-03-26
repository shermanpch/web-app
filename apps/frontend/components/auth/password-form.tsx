"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Panel } from '@/components/ui/panel';

export interface PasswordFormProps {
  onSubmit: (_passwords: { password: string; confirmPassword: string }) => Promise<void>;
  submitText?: string;
  error?: string | null;
  isLoading?: boolean;
}

export function PasswordForm({ 
  onSubmit, 
  submitText = 'Change Password',
  error: externalError,
  isLoading: externalLoading
}: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const error = externalError !== undefined ? externalError : internalError;
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  // Password validation
  const validatePassword = useCallback(() => {
    if (!password) {
      setInternalError('Password is required');
      return false;
    }
    
    if (password.length < 8) {
      setInternalError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!/\d/.test(password)) {
      setInternalError('Password must contain at least one number');
      return false;
    }
    
    if (password !== confirmPassword) {
      setInternalError('Passwords do not match');
      return false;
    }
    
    return true;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);
    
    // Validate input
    if (!validatePassword()) {
      return;
    }
    
    // Manage loading state
    if (externalLoading === undefined) {
      setInternalLoading(true);
    }

    try {
      await onSubmit({ password, confirmPassword });
    } catch (err) {
      // Set error internally only if not handled externally
      if (externalError === undefined) {
        setInternalError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      // Reset loading state
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
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
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={8}
            aria-invalid={!!error}
            aria-describedby={error ? "password-error" : undefined}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={8}
            aria-invalid={!!error}
            aria-describedby={error ? "password-error" : undefined}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Processing...' : submitText}
        </Button>
      </form>
    </Panel>
  );
} 