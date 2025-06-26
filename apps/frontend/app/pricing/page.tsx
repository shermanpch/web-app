"use client";

import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import { useQueryClient } from "@tanstack/react-query";

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Basic Insight",
    price: "Free",
    description: "Start your I Ching journey with free access to basic readings and one deep dive.",
    features: [
      "7 Basic I Ching Readings per week",
      "1 Free AI-powered Deep Dive Reading per week",
      "Understand the core meaning, changing lines, and resulting hexagram",
      "Receive direct, actionable advice for your questions",
      "Ask clarifying questions to deepen your understanding",
      "Save and revisit your reading history",
      "Standard email support",
    ],
    buttonText: "Get Started Free",
  },
  {
    name: "Deep Dive",
    price: "Beta Preview Access",
    description: "Unlock unlimited profound, personalized interpretations with our AI-enhanced Deep Dive readings.",
    features: [
      "Unlimited Basic I Ching Readings",
      "7 AI-powered Deep Dive Readings per week",
      "Expanded primary hexagram interpretation linked to your life context",
      "Contextual analysis of changing lines based on your situation",
      "In-depth exploration of the transformed hexagram's guidance",
      "Key thematic connections and overarching lessons",
      "Tailored, actionable insights and reflection prompts",
      "Identification of potential pitfalls and key strengths",
      "Ask clarifying questions to deepen your understanding",
      "Save and revisit your reading history",
      "Priority email support",
    ],
    buttonText: "Go Deep Dive",
    isPopular: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <PageLayout>
      <ContentContainer className="max-w-7xl">
        <Heading>Find the Wisdom You Seek</Heading>
        <p className="text-lg sm:text-xl text-gray-200 font-serif max-w-3xl mx-auto text-center mt-4">
          Choose a plan that aligns with your journey into the I Ching. Start free with Basic Readings and one Deep Dive, or unlock unlimited profound insights with our premium AI-enhanced interpretations.
        </p>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-12 max-w-5xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-[#D8CDBA] rounded-2xl p-6 sm:p-8 flex flex-col ${
                tier.isPopular ? "ring-4 ring-brand-button-bg" : ""
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand-button-bg text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  {tier.name}
                </h2>
                <div className="mb-3">
                  <div className="text-3xl font-bold text-gray-800">
                    {tier.price}
                  </div>
                </div>
                <p className="text-gray-600">{tier.description}</p>
              </div>

              <ul className="mb-8 space-y-4 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className="h-6 w-6 text-brand-button-bg flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-800">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => {
                  const user = queryClient.getQueryData(["currentUser"]);
                  
                  // Handle different tiers
                  if (tier.name === "Deep Dive") {
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    // Navigate to payment page for paid tier
                    router.push("/payment?tier=deep_dive");
                  } else if (tier.name === "Basic Insight") {
                    if (!user) {
                      // For free tier, redirect to login if not logged in
                      router.push("/login");
                      return;
                    }
                    // For free tier, navigate to try now if logged in
                    router.push("/try-now");
                  } else {
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    // Fallback for any other tiers
                    const tierParam = tier.name.toLowerCase().replace(/\s+/g, '_');
                    router.push(`/payment?tier=${tierParam}`);
                  }
                }}
                className={`w-full py-3 rounded-full text-white font-semibold ${
                  tier.isPopular
                    ? "bg-brand-button-bg hover:bg-brand-button-hover"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {tier.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
