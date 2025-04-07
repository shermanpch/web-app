"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { useMutation } from "@tanstack/react-query";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Extract the token from the URL on component mount
  useEffect(() => {
    if (tokenChecked) return;

    // Function to parse token from Supabase magic link
    const parseSupabaseToken = (): string | null => {
      // Check URL for direct token parameter (standard case)
      const token = searchParams?.get("token");
      if (token) {
        console.log("Token found in standard query params");
        return token;
      }

      try {
        // Try getting token from URL in various formats Supabase might use
        const url = window.location.href;

        // Format: ?token=xyz
        const tokenRegex = /[?&]token=([^&#]*)/;
        const tokenMatch = url.match(tokenRegex);
        if (tokenMatch && tokenMatch[1]) {
          console.log("Token found via regex in query params");
          return tokenMatch[1];
        }

        // Format: #access_token=xyz
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const hashToken = hashParams.get("access_token");
        if (hashToken) {
          console.log("Token found in hash fragment");
          return hashToken;
        }

        // Format often used in Supabase redirects
        const types = ["recovery", "signup", "invite"];
        for (const type of types) {
          if (url.includes(`type=${type}`) && url.includes("token=")) {
            const fullTokenRegex = new RegExp(`token=([^&]*)`);
            const match = url.match(fullTokenRegex);
            if (match && match[1]) {
              console.log(`Token found in ${type} flow`);
              return match[1];
            }
          }
        }
      } catch (error) {
        console.error("Error parsing token:", error);
      }

      return null;
    };

    const token = parseSupabaseToken();

    if (token) {
      setAccessToken(token);
      setTokenChecked(true);
    } else {
      console.error("No valid token found in URL", window.location.href);
      toast.error(
        "Invalid or missing reset token. Please request a new password reset link.",
      );
      // Redirect to forgot password page after a short delay
      setTimeout(() => {
        router.push("/forgot-password");
      }, 3000);
    }
  }, [searchParams, router, tokenChecked]);

  const resetPasswordMutation = useMutation({
    mutationFn: (params: { password: string; token: string }) =>
      authApi.resetPassword(params.password, params.token),
    onSuccess: () => {
      toast.success("Password reset successfully!");
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Failed to reset password: ${(error as Error).message}`);
      console.error("Reset password failed:", error);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    // Client-side validation
    if (!newPassword) {
      setValidationError("New password cannot be empty");
      return;
    }

    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (!accessToken) {
      setValidationError(
        "Invalid reset token. Please request a new password reset link.",
      );
      return;
    }

    resetPasswordMutation.mutate({
      password: newPassword,
      token: accessToken,
    });
  };

  return (
    <PageLayout>
      {/* Header */}
      <ContentContainer className="mb-8">
        <Heading>I Ching Divination</Heading>
        <p className="text-xl text-gray-300 font-serif text-center">
          Reset your password
        </p>
      </ContentContainer>

      {/* Form */}
      <div className="max-w-md w-full mx-auto mt-12 p-8 bg-[#D8CDBA] rounded-2xl shadow-lg">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center font-serif">
          Reset Password
        </h2>

        {(validationError || resetPasswordMutation.error) && (
          <p className="text-sm text-red-600 text-center font-medium mb-6">
            {validationError || (resetPasswordMutation.error as Error)?.message}
          </p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-gray-700 font-serif">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-gray-700 font-serif"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending || !accessToken}
            className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg mt-8 h-auto disabled:opacity-50"
          >
            {resetPasswordMutation.isPending
              ? "Resetting Password..."
              : "Reset Password"}
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
      </div>
    </PageLayout>
  );
}
