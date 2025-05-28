"use client";

import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tier = searchParams.get("tier");

  // Redirect if trying to pay for free tier
  useEffect(() => {
    if (tier === "basic_insight") {
      router.push("/profile");
    }
  }, [tier, router]);

  // Format tier name for display
  const formatTierName = (tierParam: string) => {
    return tierParam.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Don't render payment page for free tier
  if (tier === "basic_insight") {
    return (
      <PageLayout>
        <ContentContainer>
          <div className="flex justify-center items-center min-h-[50vh] text-gray-200">
            Redirecting to your profile...
          </div>
        </ContentContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ContentContainer>
        <Heading>Complete Your Purchase</Heading>
        {tier && (
          <p className="text-xl text-gray-200 font-serif text-center my-4">
            You are subscribing to: <span className="font-bold">{formatTierName(tier)}</span>
          </p>
        )}
        <p className="text-lg text-gray-300 font-serif text-center my-8">
          This is the payment page. Stripe integration is coming soon!
        </p>
        <p className="text-base text-gray-400 font-serif text-center mb-8">
          Your selected plan will provide you with unlimited personalized I Ching guidance and insights.
        </p>
        <div className="text-center">
          <Button
            disabled
            className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-8 py-3 rounded-full text-lg font-semibold opacity-50 cursor-not-allowed"
          >
            Proceed to Payment (Coming Soon)
          </Button>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}

export default function PaymentPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center items-center min-h-screen text-gray-200">Loading payment details...</div>}>
      <PaymentContent />
    </React.Suspense>
  );
} 