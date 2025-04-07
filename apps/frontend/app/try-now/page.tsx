"use client";

import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api/endpoints/user";
import { toast } from "sonner";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function TryNowPage() {
  const [question, setQuestion] = useState("");
  const router = useRouter();

  const handleNext = async () => {
    try {
      // Silently check user quota
      const quota = await userApi.getUserQuota();

      if (!quota || quota.remaining_queries <= 0) {
        toast.error(
          "You have no remaining readings. Please upgrade your membership to continue.",
          {
            duration: 5000,
            action: {
              label: "Upgrade",
              onClick: () => router.push("/pricing"),
            },
          },
        );
        return;
      }

      // If we have quota, proceed to enter numbers
      router.push(
        `/try-now/enter-numbers?question=${encodeURIComponent(question)}`,
      );
    } catch (error) {
      // If there's an error checking quota, just try to proceed
      // The quota check will happen again in the consulting page
      router.push(
        `/try-now/enter-numbers?question=${encodeURIComponent(question)}`,
      );
    }
  };

  return (
    <PageLayout>
      <ContentContainer>
        <Heading>Focus Your Mind</Heading>

        {/* Instructions */}
        <p className="text-lg sm:text-xl text-gray-300 mb-4 sm:mb-6 font-serif text-left">
          Take a moment, breathe deeply and clearly formulate your question.
        </p>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 font-serif text-left">
          Focus your intent on the question for as long as you need.
        </p>

        {/* Question Input */}
        <Textarea
          placeholder="Enter your question clearly here...."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full min-h-[120px] bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-xl p-4 sm:p-6 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none font-serif text-base sm:text-xl"
          rows={4}
        />

        {/* Next Button */}
        <div className="text-center">
          <Button
            onClick={handleNext}
            className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-8 sm:px-16 py-2 sm:py-3 rounded-full text-base sm:text-lg font-semibold mt-8 sm:mt-12 w-full sm:w-[200px]"
            disabled={!question.trim()}
          >
            Next
          </Button>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
