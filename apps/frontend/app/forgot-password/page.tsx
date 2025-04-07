"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { useMutation } from "@tanstack/react-query";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: () => {
      toast.success("Reset link sent to your email!");
      setResetSent(true);
    },
    onError: (error) => {
      toast.error(`Failed to send reset link: ${(error as Error).message}`);
      console.error("Reset password request failed:", error);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetPasswordMutation.mutate(email);
  };

  return (
    <PageLayout>
      {/* Header */}
      <div className="text-center mt-8">
        <h1 className="text-5xl font-bold text-white mb-4 font-serif">
          I Ching Divination
        </h1>
        <p className="text-xl text-gray-300 font-serif">
          Recover your account access
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md w-full mx-auto mt-12 p-8 bg-[#D8CDBA] rounded-2xl shadow-lg">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center font-serif">
          Forgot Password
        </h2>

        {resetSent ? (
          <div className="text-center space-y-6">
            <p className="text-gray-800 font-serif">
              Check your email for a link to reset your password. If it doesn't
              appear within a few minutes, check your spam folder.
            </p>
            <Link
              href="/login"
              className="block w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-3 rounded-lg text-lg text-center"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            {resetPasswordMutation.error && (
              <p className="text-sm text-red-600 text-center font-medium mb-6">
                {(resetPasswordMutation.error as Error).message}
              </p>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-serif">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your account email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg mt-8 h-auto disabled:opacity-50"
              >
                {resetPasswordMutation.isPending
                  ? "Sending Reset Link..."
                  : "Send Reset Link"}
              </Button>

              <p className="mt-6 text-center text-sm text-gray-700 font-serif">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
                >
                  Login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </PageLayout>
  );
}
