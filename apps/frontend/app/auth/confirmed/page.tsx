"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import AuthFormWrapper from "@/components/auth/AuthFormWrapper";
import { toast } from "sonner";

function ConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmationState, setConfirmationState] = useState<'loading' | 'success' | 'error' | 'direct_access'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Extract tokens from URL parameters that Supabase includes
        const accessToken = searchParams.get('access_token');
        const type = searchParams.get('type');

        // Check if this looks like a confirmation URL from Supabase
        if (type === 'signup' && accessToken) {
          // The presence of these tokens means the email was successfully confirmed by Supabase
          setConfirmationState('success');
          toast.success("Email confirmed successfully!");
          
        } else if (searchParams.has('error')) {
          // Handle any error from Supabase
          const error = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          setErrorMessage(errorDescription || error || 'Email confirmation failed');
          setConfirmationState('error');
        } else {
          // No tokens present - user accessed this page directly
          // Show a brief message then redirect to login
          setConfirmationState('direct_access');
          setTimeout(() => {
            router.push('/login');
          }, 2000); // 2 seconds to see the message
          return;
        }
      } catch (error) {
        console.error('Error during email confirmation:', error);
        setErrorMessage('An error occurred during email confirmation');
        setConfirmationState('error');
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  const footerContent = (
    <>
      Need help?{" "}
      <Link
        href="/about"
        className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
      >
        Contact Support
      </Link>
    </>
  );

  if (confirmationState === 'loading') {
    return (
      <AuthFormWrapper
        title="Confirming Email..."
        footerContent={footerContent}
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-blue-100 rounded-full p-6">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Processing your email confirmation...
            </h3>
            <p className="text-gray-600 font-serif">
              Please wait while we confirm your email address.
            </p>
          </div>
        </div>
      </AuthFormWrapper>
    );
  }

  if (confirmationState === 'error') {
    return (
      <AuthFormWrapper
        title="Confirmation Failed"
        footerContent={footerContent}
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-red-100 rounded-full p-6">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Email confirmation failed
            </h3>
            <p className="text-gray-600 font-serif">
              {errorMessage || 'There was an error confirming your email address.'}
            </p>
          </div>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Please try requesting a new confirmation email from the login page.
            </p>
            <Link href="/login">
              <Button className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg h-auto group">
                Go to Login
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </AuthFormWrapper>
    );
  }

  if (confirmationState === 'direct_access') {
    return (
      <AuthFormWrapper
        title="Redirecting..."
        footerContent={footerContent}
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-blue-100 rounded-full p-6">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Taking you to login...
            </h3>
            <p className="text-gray-600 font-serif">
              This page is for email confirmations. Redirecting you to the login page.
            </p>
          </div>
        </div>
      </AuthFormWrapper>
    );
  }

  // Success state - only shown when coming from email confirmation link
  return (
    <AuthFormWrapper
      title="Welcome to deltao.ai!"
      footerContent={footerContent}
    >
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-6">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Your email has been confirmed!
          </h3>
          <p className="text-gray-600 font-serif">
            Your account is now fully activated and ready to explore the wisdom of ancient Chinese philosophy.
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-4 pt-4">
          <Link href="/login">
            <Button className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg h-auto group">
              Continue to Login
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Additional Information */}
        <div className="border-t pt-6">
          <p className="text-xs text-gray-500 font-serif">
            Ready to receive personalized I Ching readings and divination insights
          </p>
        </div>
      </div>
    </AuthFormWrapper>
  );
}

export default function ConfirmedPage() {
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
            </div>
          </AuthFormWrapper>
        }>
          <ConfirmedContent />
        </Suspense>
      </ContentContainer>
    </PageLayout>
  );
} 