"use client";

import React, { useState, FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints/auth";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: (params: { newPass: string; currentPass?: string }) =>
      authApi.changePassword(params.newPass, params.currentPass),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setValidationError(null); // Clear validation error on success
    },
    onError: (error) => {
      toast.error(`Failed to change password: ${(error as Error).message}`);
      console.error("Change password failed:", error);
      setValidationError(null); // Clear validation error on API error
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setValidationError(null); // Clear previous validation errors

    // Client-side validation
    if (!newPassword) {
      setValidationError("New password cannot be empty.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setValidationError("New passwords do not match.");
      return;
    }

    changePasswordMutation.mutate({
      newPass: newPassword,
      currentPass: currentPassword,
    });
  };

  return (
    <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full max-w-2xl mx-auto">
      {(validationError || changePasswordMutation.error) && (
        <p className="text-sm text-red-600 text-center font-medium mb-6">
          {validationError || (changePasswordMutation.error as Error)?.message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="currentPassword"
            className="text-gray-800 font-serif block text-lg"
          >
            Current Password
          </Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current Password"
            required
            className="w-full bg-[#F5F0E6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#EDE6D6]"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="newPassword"
            className="text-gray-800 font-serif block text-lg"
          >
            New Password
          </Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
            className="w-full bg-[#F5F0E6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#EDE6D6]"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmNewPassword"
            className="text-gray-800 font-serif block text-lg"
          >
            Confirm New Password
          </Label>
          <Input
            id="confirmNewPassword"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Confirm New Password"
            required
            className="w-full bg-[#F5F0E6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#EDE6D6]"
          />
        </div>

        <Button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-serif py-4 rounded-lg text-xl mt-8 h-auto disabled:opacity-50"
        >
          {changePasswordMutation.isPending
            ? "Changing Password..."
            : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
