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
  // Define predefined options
  const AREA_OF_LIFE_OPTIONS = ["Career", "Relationships", "Personal Growth", "Health", "Finances", "Spirituality", "Other"];
  const CURRENT_FEELINGS_OPTIONS = ["Anxious", "Hopeful", "Confused", "Excited", "Sad", "Peaceful", "Stressed", "Grateful"];
  const DESIRED_OUTCOME_OPTIONS = ["Clarity", "Guidance", "Reassurance", "Insight", "Direction", "Understanding", "Other"];

  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"basic" | "deep_dive">("basic");
  
  // Area of Life states
  const [areaOfLife, setAreaOfLife] = useState("");
  const [customAreaOfLife, setCustomAreaOfLife] = useState("");
  const [showCustomAreaOfLifeInput, setShowCustomAreaOfLifeInput] = useState(false);

  // Current Feelings states - change from string to array
  const [currentFeelingsList, setCurrentFeelingsList] = useState<string[]>([]);
  const [customFeeling, setCustomFeeling] = useState("");

  // Desired Outcome states
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [customDesiredOutcome, setCustomDesiredOutcome] = useState("");
  const [showCustomDesiredOutcomeInput, setShowCustomDesiredOutcomeInput] = useState(false);

  // Keep Background Situation as is
  const [backgroundSituation, setBackgroundSituation] = useState("");
  
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
        // Updated processing of deep dive context
        const finalAreaOfLife = areaOfLife === "Other" ? customAreaOfLife : areaOfLife;
        const finalDesiredOutcome = desiredOutcome === "Other" ? customDesiredOutcome : desiredOutcome;

        if (finalAreaOfLife.trim()) queryString += `&areaOfLife=${encodeURIComponent(finalAreaOfLife.trim())}`;
        if (backgroundSituation.trim()) queryString += `&backgroundSituation=${encodeURIComponent(backgroundSituation.trim())}`;
        if (currentFeelingsList.length > 0) queryString += `&currentFeelings=${encodeURIComponent(currentFeelingsList.join(','))}`;
        if (finalDesiredOutcome.trim()) queryString += `&desiredOutcome=${encodeURIComponent(finalDesiredOutcome.trim())}`;
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
            
            {/* Area of Life - now with selectable buttons */}
            <div>
              <Label htmlFor="areaOfLifeButtons" className="text-gray-300 font-serif mb-2 block">
                Area of Life
              </Label>
              <div id="areaOfLifeButtons" className="flex flex-wrap gap-2 mb-2">
                {AREA_OF_LIFE_OPTIONS.map(option => (
                  <Button
                    key={option}
                    type="button"
                    onClick={() => {
                      setAreaOfLife(option);
                      setShowCustomAreaOfLifeInput(option === "Other");
                    }}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      areaOfLife === option 
                        ? "bg-brand-button-bg text-white shadow-md border border-brand-button-bg" 
                        : "bg-gray-800/40 text-gray-300 border border-gray-700 hover:bg-gray-700/60 hover:border-gray-600"
                    }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {showCustomAreaOfLifeInput && (
                <Input
                  id="customAreaOfLife"
                  placeholder="Please specify your area of life"
                  value={customAreaOfLife}
                  onChange={(e) => setCustomAreaOfLife(e.target.value)}
                  className="mt-2 w-full bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-lg p-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none"
                />
              )}
            </div>
            
            {/* Background Situation - keep as is */}
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
            
            {/* Current Feelings - now with multi-select and custom input */}
            <div>
              <Label className="text-gray-300 font-serif mb-2 block">
                Current Feelings (Select all that apply)
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {CURRENT_FEELINGS_OPTIONS.map(feeling => (
                  <Button
                    key={feeling}
                    type="button"
                    onClick={() => {
                      setCurrentFeelingsList(prev => 
                        prev.includes(feeling) ? prev.filter(f => f !== feeling) : [...prev, feeling]
                      );
                    }}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      currentFeelingsList.includes(feeling) 
                        ? "bg-brand-button-bg text-white shadow-md border border-brand-button-bg" 
                        : "bg-gray-800/40 text-gray-300 border border-gray-700 hover:bg-gray-700/60 hover:border-gray-600"
                    }`}
                  >
                    {feeling}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 items-center mb-2">
                <Input
                  id="customFeeling"
                  placeholder="Add a custom feeling"
                  value={customFeeling}
                  onChange={(e) => setCustomFeeling(e.target.value)}
                  className="flex-1 bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-lg p-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (customFeeling.trim() && !currentFeelingsList.includes(customFeeling.trim())) {
                      setCurrentFeelingsList(prev => [...prev, customFeeling.trim()]);
                      setCustomFeeling("");
                    }
                  }}
                  className="bg-amber-600/90 hover:bg-amber-500 text-white px-4 py-2 rounded-lg border border-amber-500"
                >
                  Add
                </Button>
              </div>
              {currentFeelingsList.length > 0 && (
                <div className="mt-2 p-3 border border-amber-600/40 rounded-lg bg-gray-900/40">
                  <span className="text-amber-400/80 text-sm mb-1 block">Selected feelings:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentFeelingsList.map((feeling, index) => (
                      <span key={index} className="inline-flex items-center bg-gray-800/70 text-amber-200 text-sm px-3 py-1 rounded-md my-1">
                        {feeling}
                        <button 
                          onClick={() => setCurrentFeelingsList(prev => prev.filter(f => f !== feeling))} 
                          className="ml-2 text-amber-400 hover:text-white focus:outline-none"
                          aria-label={`Remove ${feeling}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Desired Outcome - now with selectable buttons */}
            <div>
              <Label htmlFor="desiredOutcomeButtons" className="text-gray-300 font-serif mb-2 block">
                Desired Outcome
              </Label>
              <div id="desiredOutcomeButtons" className="flex flex-wrap gap-2 mb-2">
                {DESIRED_OUTCOME_OPTIONS.map(option => (
                  <Button
                    key={option}
                    type="button"
                    onClick={() => {
                      setDesiredOutcome(option);
                      setShowCustomDesiredOutcomeInput(option === "Other");
                    }}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      desiredOutcome === option 
                        ? "bg-brand-button-bg text-white shadow-md border border-brand-button-bg" 
                        : "bg-gray-800/40 text-gray-300 border border-gray-700 hover:bg-gray-700/60 hover:border-gray-600"
                    }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {showCustomDesiredOutcomeInput && (
                <Input
                  id="customDesiredOutcome"
                  placeholder="Please specify your desired outcome"
                  value={customDesiredOutcome}
                  onChange={(e) => setCustomDesiredOutcome(e.target.value)}
                  className="mt-2 w-full bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-lg p-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none"
                />
              )}
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
