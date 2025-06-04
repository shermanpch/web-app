"use client";

import React, { useState, Suspense } from "react";
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
import AnimatedHexagram from "@/components/divination/AnimatedHexagram";
import { Loader2 } from "lucide-react";
import {
  calculateCoordsFromNumbers,
  getInitialHexagramLines,
  getFinalHexagramLines,
} from "@/lib/divinationUtils";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.5,
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

function ResultContent() {
  const searchParams = useSearchParams();
  const readingId = searchParams.get("id");
  const queryClient = useQueryClient();
  const [clarificationInput, setClarificationInput] = useState("");
  const [isMutationInProgress, setIsMutationInProgress] = useState(false);

  // Fetch user profile status for quota check - used for invalidation only
  useQuery({
    queryKey: ["userProfileStatus"],
    queryFn: userApi.getUserProfileStatus,
    staleTime: 1000 * 60, // Reduce staleTime to 1 minute
    refetchOnMount: true, // Always refetch when component mounts
  });

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
        mode: reading.mode,
        language: reading.language,
        first_number: reading.first_number,
        second_number: reading.second_number,
        third_number: reading.third_number,
        prediction: reading.prediction!,
        clarifying_question: clarificationInput,
      });
    },
    onMutate: async () => {
      setIsMutationInProgress(true);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["userReading", readingId] });

      // Snapshot the previous value
      const previousReading = queryClient.getQueryData([
        "userReading",
        readingId,
      ]);

      // Don't optimistically update the clarifying_answer
      // This allows the loading animation to remain visible
      queryClient.setQueryData(["userReading", readingId], (old: any) => ({
        ...old,
        clarifying_question: clarificationInput,
      }));

      return { previousReading };
    },
    onSuccess: (response) => {
      // Clear input and reset mutation state
      setClarificationInput("");
      setIsMutationInProgress(false);

      // Update the reading with the actual response
      queryClient.setQueryData(["userReading", readingId], response);

      // Update quota numbers
      queryClient.invalidateQueries({
        queryKey: ["userProfileStatus"],
      });

      // Update reading history - invalidate all pages
      queryClient.invalidateQueries({
        queryKey: ["userReadings"],
        refetchType: "all",
      });
    },
    onError: (error: any, _, context) => {
      console.error("Error getting clarification:", error);
      setIsMutationInProgress(false);

      // Rollback to the previous value
      if (context?.previousReading) {
        queryClient.setQueryData(
          ["userReading", readingId],
          context.previousReading,
        );
      }
    },
  });

  const handleClarificationSubmit = () => {
    if (!reading || !clarificationInput.trim() || isMutationInProgress) return;
    setIsMutationInProgress(true);
    clarificationMutation.mutate();
  };

  if (isLoading) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
          <p className="text-gray-200 ml-3">Loading reading...</p>
        </div>
      </ContentContainer>
    );
  }

  if (error || !reading) {
    return (
      <ContentContainer>
        <p className="text-red-500">
          Error loading reading. Please try again.
        </p>
      </ContentContainer>
    );
  }

  const prediction = reading.prediction as DivinationResponse;

  // Calculate hexagram lines
  const { parentCoord, childCoord } = calculateCoordsFromNumbers(
    reading.first_number,
    reading.second_number,
    reading.third_number,
  );
  const initialLines = getInitialHexagramLines(parentCoord);
  const finalLines = getFinalHexagramLines(initialLines, parseInt(childCoord));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <ContentContainer className="max-w-5xl text-gray-200">
          <Heading>Your Hexagram Result</Heading>

          {/* Question Display */}
          <div className="text-gray-200 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-center font-serif">
            Your Question: {reading.question}
          </div>

          {/* Hexagram Visuals */}
          <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-8 md:space-x-12 space-y-6 sm:space-y-0 mb-8 sm:mb-12">
            <div className="text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
                <AnimatedHexagram lines={initialLines} />
              </div>
              <p className="text-gray-200 font-serif text-sm sm:text-base">
                Primary Hexagram
              </p>
            </div>

            <div className="text-brand-button-bg text-3xl sm:text-4xl transform sm:rotate-0 rotate-90">
              →
            </div>

            <div className="text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
                <AnimatedHexagram lines={finalLines} />
              </div>
              <p className="text-gray-200 font-serif text-sm sm:text-base">
                Transformed Hexagram
              </p>
            </div>
          </div>
        </ContentContainer>
      </motion.div>

      <motion.div variants={itemVariants}>
        <ContentContainer className="max-w-5xl">
          <div className="bg-[#D8CDBA] rounded-lg p-4 sm:p-6 md:p-8 font-serif text-gray-800 shadow-md">
            <motion.div className="space-y-4 sm:space-y-6 text-sm sm:text-base text-gray-800">
              <motion.div variants={itemVariants}>
                <h2 className="mb-3 sm:mb-4 text-gray-900">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-semibold">{prediction.hexagram_name}</span>
                    <span className="text-lg sm:text-xl font-normal text-gray-700">
                      {prediction.pinyin}
                    </span>
                  </div>
                </h2>

                <div className="mb-4 sm:mb-6 text-sm sm:text-base">
                  <span className="font-medium text-gray-800 mr-2">Summary:</span>
                  <span className="italic text-gray-700">{prediction.summary}</span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                  Primary Hexagram Interpretation
                </h3>
                <p className="text-justify text-gray-700 leading-relaxed">
                  {prediction.interpretation}
                </p>
              </motion.div>

              <hr className="my-6 border-amber-600/30" />

              <motion.div variants={itemVariants}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                  Changing Line
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 -mt-1">
                  <span className="text-lg text-gray-900 font-medium">{prediction.line_change.line}</span>
                  <span className="text-gray-600 italic">{prediction.line_change.pinyin}</span>
                </div>
                <p className="text-justify text-gray-700 leading-relaxed">
                  {prediction.line_change.interpretation}
                </p>
              </motion.div>

              <hr className="my-6 border-amber-600/30" />

              <motion.div variants={itemVariants}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                  Transformed Hexagram
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 -mt-1">
                  <span className="text-lg text-gray-900 font-medium">{prediction.result.name}</span>
                  <span className="text-gray-600 italic">{prediction.result.pinyin || "dì shuǐ shī"}</span>
                </div>
                <p className="text-justify text-gray-700 leading-relaxed">
                  {prediction.result.interpretation}
                </p>
              </motion.div>

              <hr className="my-6 border-amber-600/30" />

              <motion.div variants={itemVariants}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                  Advice
                </h3>
                <p className="text-justify text-gray-700 leading-relaxed">
                  {prediction.advice}
                </p>
              </motion.div>

              {/* Deep Dive Content */}
              {(reading.mode === "deep_dive" || prediction.deep_dive_details) && (
                <>
                  <hr className="my-6 border-amber-600/30" />
                  
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Deeper Insights: Primary Hexagram
                    </h3>
                    <p className="text-justify text-gray-700 leading-relaxed">
                      {prediction.deep_dive_details?.expanded_primary_interpretation}
                    </p>
                  </motion.div>
                  
                  <hr className="my-6 border-amber-600/30" />
                  
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Significance of the Changing Line
                    </h3>
                    <p className="text-justify text-gray-700 leading-relaxed">
                      {prediction.deep_dive_details?.contextual_changing_line_interpretation}
                    </p>
                  </motion.div>
                  
                  <hr className="my-6 border-amber-600/30" />
                  
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Deeper Insights: Transformed Hexagram
                    </h3>
                    <p className="text-justify text-gray-700 leading-relaxed">
                      {prediction.deep_dive_details?.expanded_transformed_interpretation}
                    </p>
                  </motion.div>
                  
                  <hr className="my-6 border-amber-600/30" />
                  
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Key Themes & Lessons
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed pl-2 space-y-2">
                      {prediction.deep_dive_details?.thematic_connections.map((theme, index) => (
                        <li key={index} className="text-justify">
                          {theme}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                  
                  <hr className="my-6 border-amber-600/30" />
                  
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Tailored Guidance & Reflections
                    </h3>
                    <p className="text-justify text-gray-700 leading-relaxed">
                      {prediction.deep_dive_details?.actionable_insights_and_reflections}
                    </p>
                  </motion.div>
                  
                  {prediction.deep_dive_details?.potential_pitfalls && (
                    <>
                      <hr className="my-6 border-amber-600/30" />
                      
                      <motion.div variants={itemVariants}>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                          Potential Pitfalls to Consider
                        </h3>
                        <p className="text-justify text-gray-700 leading-relaxed">
                          {prediction.deep_dive_details.potential_pitfalls}
                        </p>
                      </motion.div>
                    </>
                  )}
                  
                  {prediction.deep_dive_details?.key_strengths && (
                    <>
                      <hr className="my-6 border-amber-600/30" />
                      
                      <motion.div variants={itemVariants}>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                          Key Strengths to Leverage
                        </h3>
                        <p className="text-justify text-gray-700 leading-relaxed">
                          {prediction.deep_dive_details.key_strengths}
                        </p>
                      </motion.div>
                    </>
                  )}
                </>
              )}

              {/* Clarification Section */}
              {reading.clarifying_answer ? (
                <motion.div variants={itemVariants}>
                  <div className="mt-6 pt-6 border-t border-amber-600/30">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Clarification Question
                    </h3>
                    <p className="text-justify text-gray-700 leading-relaxed">
                      {reading.clarifying_question}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Clarification Answer
                    </h3>
                    <p className="text-justify text-gray-700 leading-relaxed">
                      {reading.clarifying_answer}
                    </p>
                  </div>
                </motion.div>
              ) : reading.clarifying_question && isMutationInProgress ? (
                <motion.div variants={itemVariants}>
                  <div className="mt-6 pt-6 border-t border-amber-600/30">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Clarification Question
                    </h3>
                    <p className="text-justify text-gray-700 leading-relaxed">
                      {reading.clarifying_question}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase">
                      Clarification Answer
                    </h3>
                    <div className="text-center py-4">
                      <div className="text-gray-700 font-serif mb-4">
                        Consulting the Oracle...
                      </div>
                      <div className="relative mx-auto w-8 h-8">
                        <div className="absolute top-0 left-0 w-full h-full border-2 border-amber-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-full h-full border-2 border-amber-600 rounded-full animate-spin border-t-transparent"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants}>
                  <div className="mt-8 pt-6 border-t border-amber-600/30">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 tracking-wide uppercase">
                      Need Clarification?
                    </h3>
                    {!reading?.clarifying_answer && !clarificationMutation.isPending && !isMutationInProgress && (
                      <>
                        {isMutationInProgress ? (
                          <div className="text-center py-8">
                            <div className="mb-6 text-gray-700 text-lg font-serif">
                              Consulting the Oracle...
                            </div>
                            <div className="relative mx-auto w-10 h-10">
                              <div className="absolute top-0 left-0 w-full h-full border-4 border-amber-200 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-full h-full border-4 border-amber-600 rounded-full animate-spin border-t-transparent"></div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Textarea
                              value={clarificationInput}
                              onChange={(e) =>
                                setClarificationInput(e.target.value)
                              }
                              placeholder="Ask a follow-up question about your reading..."
                              className="mb-4 bg-[#F5F0E6] text-gray-800 border-gray-400 focus:border-amber-600 focus:ring-amber-600"
                              disabled={isMutationInProgress}
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
                                Get Clarification
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </ContentContainer>
      </motion.div>
    </motion.div>
  );
}

export default function ResultPage() {
  return (
    <PageLayout>
      <Suspense fallback={
        <ContentContainer>
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
            <p className="text-gray-200 ml-3">Loading result...</p>
          </div>
        </ContentContainer>
      }>
        <ResultContent />
      </Suspense>
    </PageLayout>
  );
}
