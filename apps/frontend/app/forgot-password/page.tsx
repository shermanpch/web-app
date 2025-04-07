"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { useMutation } from "@tanstack/react-query";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import AuthInput from "@/components/auth/AuthInput";
import AuthFormWrapper from "@/components/auth/AuthFormWrapper";

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

  const footerContent = (
    <>
      Remember your password?{" "}
      <Link
        href="/login"
        className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
      >
        Login
      </Link>
    </>
  );

  return (
    <PageLayout>
      <ContentContainer>
        {/* Header */}
        <div className="mb-8">
          <Heading>I Ching Divination</Heading>
          <p className="text-xl text-gray-300 font-serif text-center">
            Recover your account access
          </p>
        </div>

        <AuthFormWrapper
          title="Forgot Password"
          error={resetPasswordMutation.error ? (resetPasswordMutation.error as Error).message : null}
          footerContent={!resetSent ? footerContent : undefined}
        >
          {resetSent ? (
            <div className="text-center space-y-6">
              <p className="text-gray-800 font-serif">
                Check your email for a link to reset your password. If it
                doesn&apos;t appear within a few minutes, check your spam
                folder.
              </p>
              <Link
                href="/login"
                className="block w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-3 rounded-lg text-lg text-center"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <AuthInput
                id="email"
                label="Email"
                type="email"
                placeholder="Enter your account email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
              />

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg mt-8 h-auto disabled:opacity-50"
              >
                {resetPasswordMutation.isPending
                  ? "Sending Reset Link..."
                  : "Send Reset Link"}
              </Button>
            </form>
          )}
        </AuthFormWrapper>
      </ContentContainer>
    </PageLayout>
  );
}
