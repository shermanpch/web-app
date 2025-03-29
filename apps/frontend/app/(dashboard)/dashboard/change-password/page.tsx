"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PasswordForm } from "@/components/auth/password-form";
import { useAuth } from "@/lib/auth/auth-context";

export default function ChangePasswordPage() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { changePassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async ({
    password,
  }: {
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setError(null);
      await changePassword(password);
      setSuccess(true);

      // Redirect back to dashboard after success
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while changing your password.",
      );
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

  // If not authenticated, return null (hook handles redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col p-8">
      <div className="max-w-md mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
            Change Password
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            Enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md mb-4">
            Password changed successfully! Redirecting to dashboard...
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md mb-4">
                {error}
              </div>
            )}
            <PasswordForm onSubmit={handleSubmit} />
          </>
        )}
      </div>
    </div>
  );
}
