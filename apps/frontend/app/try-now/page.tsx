"use client";

import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import { useQueryClient } from "@tanstack/react-query";
import { FrontendUserProfileStatusResponse } from "@/types/user";

export default function TryNowPage() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"basic" | "deep_dive">("basic");
  const [areaOfLife, setAreaOfLife] = useState("");
  const [backgroundSituation, setBackgroundSituation] = useState("");
  const [currentFeelings, setCurrentFeelings] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleNext = async () => {
    try {
      // Check cached profile status first
      const profileStatus: FrontendUserProfileStatusResponse | undefined =
        queryClient.getQueryData(["userProfileStatus"]);

      let hasQuota = true; // Default to true (allow if cache miss)
      if (profileStatus?.quotas) {
        const featureName = mode === "deep_dive" ? "premium_divination" : "basic_divination";
        
        const divinationQuota = profileStatus.quotas.find(
          (q) => q.feature_name === featureName,
        );
        
        if (divinationQuota) {
          // Check if limit is null (unlimited) OR remaining is greater than 0
          hasQuota =
            divinationQuota.limit === null ||
            (divinationQuota.remaining !== null &&
              divinationQuota.remaining > 0);
        } else {
          // If quota info is missing, cautiously allow (backend will check)
          console.warn(`${featureName} quota info not found in cached data.`);
        }
      } else {
        // If profileStatus or quotas are missing from cache, allow (backend will check)
        console.warn(
          "User profile/quota status not found in cache. Proceeding, backend will verify quota.",
        );
      }

      if (!hasQuota) {
        toast.error(
          `You have no remaining ${mode === "deep_dive" ? "premium" : "basic"} readings. Please upgrade your membership to continue.`,
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

      // Build the query string with mode and Deep Dive context if applicable
      let queryString = `?question=${encodeURIComponent(question)}&mode=${mode}`;
      
      if (mode === "deep_dive") {
        // Only include filled fields
        if (areaOfLife) queryString += `&areaOfLife=${encodeURIComponent(areaOfLife)}`;
        if (backgroundSituation) queryString += `&backgroundSituation=${encodeURIComponent(backgroundSituation)}`;
        if (currentFeelings) queryString += `&currentFeelings=${encodeURIComponent(currentFeelings)}`;
        if (desiredOutcome) queryString += `&desiredOutcome=${encodeURIComponent(desiredOutcome)}`;
      }
      
      // Navigate to enter numbers with the constructed query string
      router.push(`/try-now/enter-numbers${queryString}`);
    } catch (error) {
      console.error("Error checking quota:", error);
      // If there's an error checking quota, just try to proceed
      // The backend will perform the definitive check
      router.push(
        `/try-now/enter-numbers?question=${encodeURIComponent(question)}&mode=${mode}`,
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

        {/* Reading Mode Selector */}
        <div className="mt-8 mb-6">
          <p className="text-lg text-gray-300 mb-4 font-serif text-left">
            Choose your reading type:
          </p>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => setMode("basic")}
              className={`flex-1 sm:flex-none ${
                mode === "basic"
                  ? "bg-brand-button-bg text-white"
                  : "bg-opacity-20 bg-gray-700 text-gray-300"
              } hover:bg-brand-button-hover px-4 py-2 rounded-lg text-base font-medium`}
            >
              Basic Reading
            </Button>
            <Button
              type="button"
              onClick={() => setMode("deep_dive")}
              className={`flex-1 sm:flex-none ${
                mode === "deep_dive"
                  ? "bg-brand-button-bg text-white"
                  : "bg-opacity-20 bg-gray-700 text-gray-300"
              } hover:bg-brand-button-hover px-4 py-2 rounded-lg text-base font-medium`}
            >
              Deep Dive Reading
            </Button>
          </div>
        </div>

        {/* Deep Dive Context Inputs (conditional) */}
        {mode === "deep_dive" && (
          <div className="mt-6 mb-8 space-y-6 border border-amber-600/30 rounded-xl p-6 bg-opacity-10 bg-amber-900">
            <div className="mb-4">
              <p className="text-lg text-amber-300 font-serif mb-2">Deep Dive Reading</p>
              <p className="text-sm text-gray-300">
                Providing additional context will help create a more personalized and insightful reading. 
                This premium feature requires a premium divination credit.
              </p>
            </div>
            
            <div>
              <Label htmlFor="areaOfLife" className="text-gray-300 font-serif mb-2 block">
                Area of Life
              </Label>
              <Input
                id="areaOfLife"
                placeholder="Career, Relationships, Personal Growth, etc."
                value={areaOfLife}
                onChange={(e) => setAreaOfLife(e.target.value)}
                className="w-full bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-lg p-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none"
              />
            </div>
            
            <div>
              <Label htmlFor="backgroundSituation" className="text-gray-300 font-serif mb-2 block">
                Background Situation
              </Label>
              <Textarea
                id="backgroundSituation"
                placeholder="Briefly describe the context or situation surrounding your question..."
                value={backgroundSituation}
                onChange={(e) => setBackgroundSituation(e.target.value)}
                className="w-full bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-lg p-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="currentFeelings" className="text-gray-300 font-serif mb-2 block">
                Current Feelings
              </Label>
              <Input
                id="currentFeelings"
                placeholder="Anxious, Hopeful, Confused, etc. (comma separated)"
                value={currentFeelings}
                onChange={(e) => setCurrentFeelings(e.target.value)}
                className="w-full bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-lg p-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none"
              />
            </div>
            
            <div>
              <Label htmlFor="desiredOutcome" className="text-gray-300 font-serif mb-2 block">
                Desired Outcome
              </Label>
              <Input
                id="desiredOutcome"
                placeholder="What you hope to gain from this reading (clarity, reassurance, etc.)"
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                className="w-full bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-lg p-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none"
              />
            </div>
          </div>
        )}

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
