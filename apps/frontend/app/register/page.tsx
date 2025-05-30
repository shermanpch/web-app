"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { userApi } from "@/lib/api/endpoints/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SignUpCredentials } from "@/types/auth";
import { toast } from "sonner";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import AuthInput from "@/components/auth/AuthInput";
import AuthFormWrapper from "@/components/auth/AuthFormWrapper";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: async (response) => {
      // Check if email confirmation is required
      const user = response.data.user;
      const isEmailConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;
      
      if (!isEmailConfirmed) {
        // Email confirmation is pending - redirect to pending page
        toast.success("Registration successful! Please check your email to confirm your account.");
        router.push(`/auth/pending-confirmation?email=${encodeURIComponent(email)}`);
        return;
      }

      // Email is confirmed or confirmation is disabled - proceed with normal flow
      // Update the user data in the cache
      queryClient.setQueryData(["currentUser"], response.data.user);

      // Force a refetch of the current user
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Prefetch first page of readings data immediately after registration
      queryClient.prefetchQuery({
        queryKey: ["userReadings", 1],
        queryFn: () => userApi.getUserReadings({ page: 1, limit: 10 }),
        staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 minutes
      });

      toast.success("Registration successful!");

      // Navigate using Next.js router
      router.push("/try-now");
      router.refresh();
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      toast.error(`Registration failed: ${(error as Error).message}`);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return;
    }

    if (!agreeTerms) {
      setValidationError(
        "You must agree to the Terms of Service and Privacy Policy",
      );
      return;
    }

    const credentials: SignUpCredentials = { email, password };
    signupMutation.mutate(credentials);
  };

  const footerContent = (
    <>
      Already have an account?{" "}
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
          <Heading>deltao.ai</Heading>
          <p className="text-xl text-gray-300 font-serif text-center">
            Your personal Deltao AI oracle rooted in 3000 years of ancient
            Chinese Philosophy
          </p>
        </div>

        <AuthFormWrapper
          title="Create Account"
          error={validationError || (signupMutation.error as Error)?.message}
          footerContent={footerContent}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <AuthInput
              id="email"
              label="Email"
              type="email"
              placeholder="Enter your Email here"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
            />

            <AuthInput
              id="password"
              label="Password"
              type="password"
              placeholder="Create a Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
            />

            <AuthInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm your Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
            />

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked: boolean | string) =>
                  setAgreeTerms(Boolean(checked))
                }
                className="border-gray-400 data-[state=checked]:bg-[#B88A6A] data-[state=checked]:border-[#B88A6A]"
              />
              <Label
                htmlFor="terms"
                className="text-sm text-gray-700 font-serif"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg mt-8 h-auto disabled:opacity-50"
            >
              {signupMutation.isPending
                ? "Creating Account..."
                : "Create Account"}
            </Button>
          </form>
        </AuthFormWrapper>
      </ContentContainer>
    </PageLayout>
  );
}
