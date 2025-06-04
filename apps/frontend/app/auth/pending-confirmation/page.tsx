"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import AuthInput from "@/components/auth/AuthInput";
import AuthFormWrapper from "@/components/auth/AuthFormWrapper";

function PendingConfirmationContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailFromQuery);
  const [showResendForm, setShowResendForm] = useState(!emailFromQuery);
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
      setShowResendForm(false);
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

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    setResendError(null);
    
    // Check if we're still in cooldown
    if (lastResendTime && Date.now() - lastResendTime < 60000) {
      const remainingSeconds = Math.ceil((60000 - (Date.now() - lastResendTime)) / 1000);
      const error = `Please wait ${remainingSeconds} seconds before requesting another email.`;
      setResendError(error);
      return;
    }
    
    if (!email.trim()) {
      const error = "Please enter your email address";
      setResendError(error);
      return;
    }
    resendMutation.mutate(email.trim());
  };

  const isResendDisabled = resendMutation.isPending || cooldownSeconds > 0;

  const footerContent = (
    <>
      Already confirmed your email?{" "}
      <Link
        href="/login"
        className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
      >
        Login here
      </Link>
    </>
  );

  return (
    <AuthFormWrapper
      title="Check Your Email"
      footerContent={footerContent}
    >
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-900">
            Thank you for registering!
          </h3>
          <p className="text-gray-600 font-serif">
            A confirmation link has been sent to your email address. Please
            check your inbox (and spam folder) to complete your
            registration.
          </p>
          {emailFromQuery && (
            <p className="text-sm text-gray-500 font-mono">
              Email sent to: {emailFromQuery}
            </p>
          )}
        </div>

        {/* Resend Section */}
        <div className="border-t pt-6">
          {!showResendForm ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the email?
              </p>
              <Button
                onClick={() => {
                  setShowResendForm(true);
                  setResendError(null);
                }}
                variant="outline"
                className="w-full border-[#B88A6A] text-[#B88A6A] hover:bg-[#B88A6A] hover:text-white"
              >
                Resend Confirmation Email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              <p className="text-sm text-gray-600 mb-3">
                Enter your email to resend the confirmation:
              </p>
              
              {/* Error Display */}
              {resendError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      {resendError}
                    </div>
                  </div>
                </div>
              )}
              
              <AuthInput
                id="resend-email"
                label="Email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isResendDisabled}
                  className="flex-1 bg-[#B88A6A] hover:bg-[#a87a5a] text-white"
                >
                  {resendMutation.isPending 
                    ? "Sending..." 
                    : cooldownSeconds > 0 
                      ? `Wait ${cooldownSeconds}s` 
                      : "Resend Email"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResendForm(false);
                    setResendError(null);
                  }}
                  className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthFormWrapper>
  );
}

export default function PendingConfirmationPage() {
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

        <Suspense fallback={
          <AuthFormWrapper title="Loading...">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading confirmation details...</p>
            </div>
          </AuthFormWrapper>
        }>
          <PendingConfirmationContent />
        </Suspense>
      </ContentContainer>
    </PageLayout>
  );
} 