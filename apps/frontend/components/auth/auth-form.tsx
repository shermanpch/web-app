"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { AuthFormProps } from "@/types/auth";

export function AuthForm({
  type,
  onSubmit,
  error: externalError,
  isLoading: externalLoading,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);

  // Use external state if provided, otherwise use internal state
  const error = externalError !== undefined ? externalError : internalError;
  const isLoading =
    externalLoading !== undefined ? externalLoading : internalLoading;

  const validateForm = () => {
    if (!email) {
      setInternalError("Email is required");
      return false;
    }

    if (!password) {
      setInternalError("Password is required");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInternalError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Only manage loading state internally if not provided externally
    if (externalLoading === undefined) {
      setInternalLoading(true);
    }

    try {
      // Submit form
      await onSubmit({ email, password });
    } catch (err) {
      // Only set error internally if not provided externally
      if (externalError === undefined) {
        setInternalError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      }
    } finally {
      // Only manage loading state internally if not provided externally
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };

  const errorId = error ? "auth-form-error" : undefined;

  return (
    <Panel>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4" aria-live="assertive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription id={errorId}>{error}</AlertDescription>
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
            aria-invalid={!!error}
            aria-describedby={errorId}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {type === "login" && (
              <Link
                href="/forgot-password"
                className="text-sm text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none"
              >
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
            aria-invalid={!!error}
            aria-describedby={errorId}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Loading..." : type === "login" ? "Sign In" : "Sign Up"}
        </Button>

        <div className="text-center text-sm mt-4">
          {type === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none"
              >
                Sign up
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/80)] focus:outline-none"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}
