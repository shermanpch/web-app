"use client";

import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
    name: "Basic",
    price: "$9.99",
    description: "Perfect for getting started with I Ching readings",
    features: [
      "10 readings per month",
      "Basic interpretation",
      "Email support",
      "Access to basic guides",
    ],
    buttonText: "Start Basic",
  },
  {
    name: "Premium",
    price: "$19.99",
    description: "Our most popular plan for serious seekers",
    features: [
      "30 readings per month",
      "Detailed interpretations",
      "Priority email support",
      "Access to all guides",
      "Clarifying questions",
      "Save readings history",
    ],
    buttonText: "Go Premium",
    isPopular: true,
  },
  {
    name: "Unlimited",
    price: "$39.99",
    description: "For professionals and dedicated practitioners",
    features: [
      "Unlimited readings",
      "Advanced interpretations",
      "24/7 priority support",
      "Access to all guides",
      "Unlimited clarifying questions",
      "Extended readings history",
      "Custom consultation time",
    ],
    buttonText: "Go Unlimited",
  },
];

export default function PricingPage() {
  const router = useRouter();

  return (
    <PageLayout>
      <div className="flex min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 font-serif">
              Choose Your Path
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 font-serif max-w-3xl mx-auto">
              Select the plan that best suits your journey of self-discovery and
              spiritual growth
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
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
                  <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
                  <div className="text-3xl font-bold mb-3">{tier.price}</div>
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
                      <span className="ml-3">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => router.push("/login")}
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

          {/* FAQ or Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-gray-300 font-serif">
              All plans include a 14-day money-back guarantee.{" "}
              <button
                onClick={() => router.push("/how-it-works")}
                className="text-brand-button-bg hover:text-brand-button-hover underline"
              >
                Learn more about our services
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
