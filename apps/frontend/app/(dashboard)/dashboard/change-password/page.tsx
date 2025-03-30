"use client";

import { useState } from "react";
import { PasswordForm } from "@/components/auth/password-form";
import { authApi } from "@/lib/api/endpoints/auth";
import { usePageState } from "@/hooks/use-page-state";

export default function ChangePasswordPage() {
  // Use the hook for loading and error state
  const { isLoading, error, withLoadingState, setError } = usePageState();
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async ({
    password,
  }: {
    password: string;
    confirmPassword: string;
  }) => {
    // Clear error manually if needed before the async operation
    setError(null);
    
    await withLoadingState(async () => {
      await authApi.changePassword(password);
      setSuccess(true); // Set success on successful API call
    }, "An error occurred while changing your password."); // Custom error message
  };

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
          <PasswordForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            error={error}
          />
        )}
      </div>
    </div>
  );
}
