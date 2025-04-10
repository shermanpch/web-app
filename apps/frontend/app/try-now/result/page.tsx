"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { divinationApi } from "@/lib/api/endpoints/divination";
import { authApi } from "@/lib/api/endpoints/auth";
import { userApi } from "@/lib/api/endpoints/user";
import type { DivinationResponse } from "@/types/divination";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import Link from "next/link";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function ResultPage() {
  const searchParams = useSearchParams();
  const readingId = searchParams.get("id");
  const queryClient = useQueryClient();
  const [clarificationInput, setClarificationInput] = useState("");
  const [isMutationInProgress, setIsMutationInProgress] = useState(false);

  // Fetch user profile status for quota check
  const { data: profileStatus } = useQuery({
    queryKey: ["userProfileStatus"],
    queryFn: userApi.getUserProfileStatus,
    staleTime: 1000 * 60, // Reduce staleTime to 1 minute
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Determine if user can submit clarification
  const canClarify = useMemo(() => {
    if (!profileStatus?.quotas) return false;
    const premiumQuota = profileStatus.quotas.find(
      (q) => q.feature_name === "premium_divination",
    );
    return (
      premiumQuota &&
      (premiumQuota.limit === null ||
        (premiumQuota.remaining !== null && premiumQuota.remaining > 0))
    );
  }, [profileStatus]);

  // Fetch reading data
  const {
    data: reading,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userReading", readingId],
    queryFn: () => {
      if (!readingId) throw new Error("No reading ID provided");
      return userApi.getUserReadingById(readingId);
    },
    enabled: !!readingId,
    staleTime: 1000 * 60 * 10, // 10 minutes - data doesn't change unless clarification is added
    refetchOnMount: false, // Don't refetch on navigation unless forced by resetQueries
  });

  const clarificationMutation = useMutation({
    mutationFn: async () => {
      if (!reading || !clarificationInput.trim()) {
        throw new Error("Reading or question is missing");
      }

      // Get current user
      const user = await authApi.getCurrentUser();
      if (!user) {
        throw new Error("User not found");
      }

      // Update reading with clarification
      return await divinationApi.updateIchingReading({
        id: reading.id,
        user_id: user.id,
        question: reading.question,
        first_number: reading.first_number,
        second_number: reading.second_number,
        third_number: reading.third_number,
        language: reading.language,
        prediction: reading.prediction!,
        clarifying_question: clarificationInput,
      });
    },
    onSuccess: () => {
      // Clear input and reset mutation state
      setClarificationInput("");
      setIsMutationInProgress(false);

      // Invalidate the reading query with resetQueries to force a refetch
      queryClient.resetQueries({
        queryKey: ["userReading", readingId],
      });

      // Also invalidate the user profile status to update quota numbers
      queryClient.invalidateQueries({
        queryKey: ["userProfileStatus"],
      });

      // Invalidate reading history to include the clarification update
      queryClient.invalidateQueries({
        queryKey: ["userReadings"],
      });
    },
    onError: (error: any) => {
      console.error("Error getting clarification:", error);
      setIsMutationInProgress(false);
    },
  });

  const handleClarificationSubmit = () => {
    if (!reading || !clarificationInput.trim() || isMutationInProgress) return;
    setIsMutationInProgress(true);
    clarificationMutation.mutate();
  };

  if (isLoading) {
    return (
      <PageLayout>
        <ContentContainer>
          <p className="text-gray-200">Loading reading...</p>
        </ContentContainer>
      </PageLayout>
    );
  }

  if (error || !reading) {
    return (
      <PageLayout>
        <ContentContainer>
          <p className="text-red-500">
            Error loading reading. Please try again.
          </p>
        </ContentContainer>
      </PageLayout>
    );
  }

  const prediction = reading.prediction as DivinationResponse;

  return (
    <PageLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants}>
          <ContentContainer className="max-w-4xl text-gray-200">
            <Heading>Your Hexagram Result</Heading>

            {/* Question Display */}
            <div className="text-gray-200 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-center font-serif">
              Your Question: {reading.question}
            </div>

            {/* Hexagram Visuals */}
            <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-8 md:space-x-12 space-y-6 sm:space-y-0 mb-8 sm:mb-12">
              <div className="text-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-300 mb-2"></div>
                <p className="text-gray-200 font-serif text-sm sm:text-base">
                  Initial Hexagram
                </p>
              </div>

              <div className="text-brand-button-bg text-3xl sm:text-4xl transform sm:rotate-0 rotate-90">
                →
              </div>

              <div className="text-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-300 mb-2"></div>
                <p className="text-gray-200 font-serif text-sm sm:text-base">
                  Final Hexagram
                </p>
              </div>
            </div>
          </ContentContainer>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ContentContainer className="max-w-4xl">
            <div className="bg-[#D8CDBA] rounded-lg p-4 sm:p-6 md:p-8 font-serif text-gray-800">
              <motion.div className="space-y-4 sm:space-y-6 text-sm sm:text-base text-gray-800">
                <motion.div variants={itemVariants}>
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">
                    {prediction.hexagram_name}
                  </h2>

                  <div className="italic mb-4 sm:mb-6 text-sm sm:text-base text-gray-800">
                    Keywords: {prediction.summary}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <h3 className="font-bold mb-1 sm:mb-2 text-gray-800">
                    Initial Hexagram Interpretation
                  </h3>
                  <p className="text-justify text-gray-800">
                    {prediction.interpretation}
                  </p>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <h3 className="font-bold mb-1 sm:mb-2 text-gray-800">
                    Changing Line ({prediction.line_change.line})
                  </h3>
                  <p className="text-justify text-gray-800">
                    {prediction.line_change.interpretation}
                  </p>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <h3 className="font-bold mb-1 sm:mb-2 text-gray-800">
                    Resulting Hexagram ({prediction.result.name})
                  </h3>
                  <p className="text-justify text-gray-800">
                    {prediction.result.interpretation}
                  </p>
                </motion.div>

                {/* Clarification Section */}
                {reading.clarifying_answer ? (
                  <motion.div variants={itemVariants}>
                    <div className="mt-6 pt-4 border-t border-amber-600/20">
                      <h3 className="font-bold mb-1 sm:mb-2 text-gray-800">
                        Clarification Question
                      </h3>
                      <p className="text-justify text-gray-800">
                        {reading.clarifying_question}
                      </p>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-bold mb-1 sm:mb-2 text-gray-800">
                        Clarification Answer
                      </h3>
                      <p className="text-justify text-gray-800">
                        {reading.clarifying_answer}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants}>
                    <div className="mt-8">
                      <h3 className="font-bold mb-4 text-gray-800">
                        Need Clarification?
                      </h3>
                      {canClarify ? (
                        <>
                          <Textarea
                            value={clarificationInput}
                            onChange={(e) =>
                              setClarificationInput(e.target.value)
                            }
                            placeholder="Ask a follow-up question about your reading..."
                            className="mb-4 bg-white text-gray-800"
                          />
                          <div className="flex justify-center">
                            <Button
                              onClick={handleClarificationSubmit}
                              disabled={
                                !clarificationInput.trim() ||
                                isMutationInProgress
                              }
                              className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-6 py-2 rounded-full font-semibold"
                            >
                              {isMutationInProgress
                                ? "Getting Clarification..."
                                : "Get Clarification"}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-800 mb-4">
                            You need premium access to ask clarification
                            questions.
                          </p>
                          <Link href="/pricing">
                            <Button className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-6 py-2 rounded-full font-semibold">
                              Upgrade to Premium
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </ContentContainer>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
}
