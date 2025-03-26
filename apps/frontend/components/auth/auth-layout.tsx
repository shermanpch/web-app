"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AuthLayoutProps } from '@/types/auth';

export function AuthLayout({ children, title, error }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[hsl(var(--background))]">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-[hsl(var(--foreground))]">
          {title}
        </h1>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {children}
      </div>
    </div>
  );
} 