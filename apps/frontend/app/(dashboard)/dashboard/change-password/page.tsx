"use client";

import { useState } from "react";
import { PasswordForm } from "@/components/auth/password-form";
import { authApi } from "@/lib/api/endpoints/auth";

export default function ChangePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async ({
    password,
  }: {
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setError(null);
      setIsLoading(true);
      await authApi.changePassword(password);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while changing your password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-8">
      <div className="max-w-md mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
            Change Password
          </h1>
          {!success && (
            <p className="text-[hsl(var(--muted-foreground))] mt-2">
              Enter your new password below.
            </p>
          )}
        </div>

        {success ? (
          <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md mb-4">
            Password changed successfully!
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md mb-4">
                {error}
              </div>
            )}
            <PasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
          </>
        )}
      </div>
    </div>
  );
}
