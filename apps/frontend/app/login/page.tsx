"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginCredentials } from "@/types/auth";
import { userApi } from "@/lib/api/endpoints/user";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import AuthInput from "@/components/auth/AuthInput";
import AuthFormWrapper from "@/components/auth/AuthFormWrapper";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const resendMutation = useMutation({
    mutationFn: authApi.resendConfirmationEmail,
    onSuccess: () => {
      toast.success("Confirmation email sent! Please check your inbox.");
      setShowEmailNotConfirmed(false);
      setResendError(null);
      setLastResendTime(Date.now());
      setCooldownSeconds(60); // 60 second cooldown
    },
    onError: (error) => {
      console.error("Resend failed:", error);
      const errorMessage = (error as Error).message;
      setResendError(errorMessage);
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      // Update the user data in the cache
      queryClient.setQueryData(["currentUser"], response.data.user);

      // Force a refetch of the current user
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Navigate to the try-now page immediately
      router.push("/try-now");
      router.refresh();

      // Defer prefetch calls to run after navigation starts
      setTimeout(() => {
        // Prefetch user profile status in the background
        queryClient.prefetchQuery({
          queryKey: ["userProfileStatus"],
          queryFn: userApi.getUserProfileStatus,
          staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 minutes
        });

        // Prefetch first page of readings data in the background
        queryClient.prefetchQuery({
          queryKey: ["userReadings", 1],
          queryFn: () => userApi.getUserReadings({ page: 1, limit: 5 }),
          staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 minutes
        });
      }, 0);
    },
    onError: (error) => {
      console.error("Login failed:", error);
      const errorMessage = (error as Error).message;
      
      // Check if the error is about email not being confirmed
      if (errorMessage.toLowerCase().includes("email not confirmed")) {
        setShowEmailNotConfirmed(true);
        setResendError(null);
      } else {
        setShowEmailNotConfirmed(false);
      }
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowEmailNotConfirmed(false);
    setResendError(null);
    const credentials: LoginCredentials = { email, password, rememberMe };
    loginMutation.mutate(credentials);
  };

  const handleResendConfirmation = () => {
    setResendError(null);
    
    // Check if we're still in cooldown
    if (lastResendTime && Date.now() - lastResendTime < 60000) {
      const remainingSeconds = Math.ceil((60000 - (Date.now() - lastResendTime)) / 1000);
      const error = `Please wait ${remainingSeconds} seconds before requesting another email.`;
      setResendError(error);
      return;
    }
    
    if (!email.trim()) {
      const error = "Please enter your email address first";
      setResendError(error);
      return;
    }
    resendMutation.mutate(email.trim());
  };

  const isResendDisabled = resendMutation.isPending || cooldownSeconds > 0;

  const getErrorMessage = () => {
    if (!loginMutation.error) return null;
    
    const errorMessage = (loginMutation.error as Error).message;
    if (errorMessage.toLowerCase().includes("email not confirmed")) {
      return "Your email address is not confirmed. Please check your inbox for a confirmation email.";
    }
    return errorMessage;
  };

  const footerContent = (
    <>
      Don&apos;t have an account?{" "}
      <Link
        href="/register"
        className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
      >
        Register Now
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
          title="Welcome Back!"
          error={getErrorMessage()}
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
              placeholder="Enter your Password here"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
            />

            {/* Options Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean | string) =>
                    setRememberMe(Boolean(checked))
                  }
                  className="border-gray-400 data-[state=checked]:bg-[#B88A6A] data-[state=checked]:border-[#B88A6A]"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-700 font-serif"
                >
                  Remember Me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-[#B88A6A] hover:text-[#a87a5a] font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Email Not Confirmed Section */}
            {showEmailNotConfirmed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex flex-col space-y-3">
                  <p className="text-sm text-yellow-800">
                    Your email needs to be confirmed before you can log in.
                  </p>
                  
                  {/* Resend Error Display */}
                  {resendError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-red-800">
                          {resendError}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isResendDisabled}
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                  >
                    {resendMutation.isPending 
                      ? "Sending..." 
                      : cooldownSeconds > 0 
                        ? `Wait ${cooldownSeconds}s` 
                        : "Resend Confirmation Email"}
                  </Button>
                </div>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg mt-8 h-auto disabled:opacity-50"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </AuthFormWrapper>
      </ContentContainer>
    </PageLayout>
  );
}
