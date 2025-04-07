"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { userApi } from "@/lib/api/endpoints/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SignUpCredentials } from "@/types/auth";
import { toast } from "sonner";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

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
      console.log("Registration successful:", response);

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

      // Prefetch user quota/profile data immediately after registration
      queryClient.prefetchQuery({
        queryKey: ["userQuota"],
        queryFn: userApi.getUserQuota,
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

  return (
    <PageLayout>
      <ContentContainer>
        {/* Header */}
        <div className="mb-8">
          <Heading>I Ching Divination</Heading>
          <p className="text-xl text-gray-300 font-serif text-center">
            AI Powered oracle rooted in 3000 years of ancient Chinese Philosophy
          </p>
        </div>

        {/* Registration Form */}
        <div className="max-w-md w-full mx-auto mt-12 p-8 bg-[#D8CDBA] rounded-2xl shadow-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center font-serif">
            Create Account
          </h2>

          {(validationError || signupMutation.error) && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-6 p-2 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <p>{validationError || (signupMutation.error as Error)?.message}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
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
                  placeholder="Enter your Email here"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-serif">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
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
                  placeholder="Confirm your Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
                />
              </div>
            </div>

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
              <Label htmlFor="terms" className="text-sm text-gray-700 font-serif">
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

            {/* Login Link */}
            <p className="mt-6 text-center text-sm text-gray-700 font-serif">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
