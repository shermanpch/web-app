"use client";

import React, { useState, FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageState } from "@/hooks/use-page-state";
import { authApi } from "@/lib/api/endpoints/auth";

export default function ChangePasswordForm() {
  const { isLoading, error, setError, clearError, withLoadingState } = usePageState();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Client-side validation
    if (!newPassword) {
      setError("New password cannot be empty.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    clearError();

    await withLoadingState(async () => {
      await authApi.changePassword(newPassword, currentPassword);
      toast.success("Password changed successfully!");
      // Clear form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }, "Failed to change password. Please check your current password.");
  };

  return (
    <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-serif text-gray-800 mb-8 text-center">
        Change Password
      </h2>

      {error && (
        <p className="text-sm text-red-600 text-center font-medium mb-6">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-gray-800 font-serif block text-lg">
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
          <Label htmlFor="newPassword" className="text-gray-800 font-serif block text-lg">
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
          <Label htmlFor="confirmNewPassword" className="text-gray-800 font-serif block text-lg">
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
          disabled={isLoading}
          className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-serif py-4 rounded-lg text-xl mt-8 h-auto disabled:opacity-50"
        >
          {isLoading ? "Changing Password..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
} 