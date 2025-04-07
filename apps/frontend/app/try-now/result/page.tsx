"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { divinationApi } from "@/lib/api/endpoints/divination";
import { authApi } from "@/lib/api/endpoints/auth";
import type { DivinationResponse } from "@/types/divination";

interface ExtendedDivinationResponse extends DivinationResponse {
  reading_id?: string;
  clarifying_question?: string;
  clarifying_answer?: string;
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reading, setReading] = useState<ExtendedDivinationResponse | null>(
    null,
  );
  const [clarificationInput, setClarificationInput] = useState("");
  const [clarificationAnswer, setClarificationAnswer] = useState<string | null>(
    null,
  );
  const [isMutationInProgress, setIsMutationInProgress] = useState(false);

  const clarificationMutation = useMutation({
    mutationFn: async () => {
      if (!reading || !clarificationInput.trim()) {
        throw new Error("Reading or question is missing");
      }

      // Early return if reading_id is not available
      if (!reading.reading_id) {
        throw new Error("Cannot clarify - reading ID not found");
      }

      // Get current user
      const user = await authApi.getCurrentUser();
      if (!user) {
        throw new Error("User not found");
      }

      // Update reading with clarification
      const updateResponse = await divinationApi.updateIchingReading({
        id: reading.reading_id as string,
        user_id: user.id,
        question: reading.question,
        first_number: reading.first_number,
        second_number: reading.second_number,
        third_number: reading.third_number,
        language: reading.language,
        prediction: reading,
        clarifying_question: clarificationInput,
      });

      return updateResponse;
    },
    onSuccess: (updateResponse) => {
      if (!reading) return;

      // Create updated reading object
      const updatedReading: ExtendedDivinationResponse = {
        ...reading,
        clarifying_question: clarificationInput,
        clarifying_answer: updateResponse.clarifying_answer,
      };

      // Update state
      setClarificationAnswer(updateResponse.clarifying_answer);
      setReading(updatedReading);
      setClarificationInput("");

      // Update URL with new reading data to persist across navigation
      const readingDataString = JSON.stringify(updatedReading);
      router.replace(
        `/try-now/result?reading=${encodeURIComponent(readingDataString)}`,
      );
    },
    onError: (error: any) => {
      console.error("Error getting clarification:", error);
    },
  });

  useEffect(() => {
    const readingString = searchParams.get("reading");
    if (readingString) {
      try {
        const parsedReading = JSON.parse(decodeURIComponent(readingString));
        setReading(parsedReading as ExtendedDivinationResponse);

        // Set clarification answer from parsed reading if available
        if (parsedReading.clarifying_answer) {
          setClarificationAnswer(parsedReading.clarifying_answer);
        }
      } catch (error) {
        console.error("Error parsing reading:", error);
      }
    }
  }, [searchParams]);

  const handleClarificationSubmit = () => {
    if (!reading || !clarificationInput.trim() || isMutationInProgress) return;

    setIsMutationInProgress(true);
    clarificationMutation.mutate();
  };

  useEffect(() => {
    if (clarificationMutation.isSuccess) {
      setIsMutationInProgress(false);
    } else if (clarificationMutation.isError) {
      setIsMutationInProgress(false);
    }
  }, [clarificationMutation.isSuccess, clarificationMutation.isError]);

  if (!reading) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white">Loading reading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex min-h-screen">
        <motion.div
          className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8 font-serif text-center">
            Your Hexagram Result
          </h1>

          {/* Question Display */}
          <div className="text-white text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-center font-serif">
            Your Question: {reading.question}
          </div>

          {/* Hexagram Visuals */}
          <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-8 md:space-x-12 space-y-6 sm:space-y-0 mb-8 sm:mb-12">
            <div className="text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-300 mb-2"></div>
              <p className="text-white font-serif text-sm sm:text-base">
                Initial Hexagram
              </p>
            </div>

            <div className="text-brand-button-bg text-3xl sm:text-4xl transform sm:rotate-0 rotate-90">
              →
            </div>

            <div className="text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-300 mb-2"></div>
              <p className="text-white font-serif text-sm sm:text-base">
                Final Hexagram
              </p>
            </div>
          </div>

          {/* Interpretation Card */}
          <div className="bg-[#D8CDBA] rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 font-serif">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              {reading.hexagram_name}
            </h2>

            <div className="italic mb-4 sm:mb-6 text-sm sm:text-base">
              Keywords: {reading.summary}
            </div>

            <div className="space-y-4 sm:space-y-6 text-sm sm:text-base">
              <div>
                <h3 className="font-bold mb-1 sm:mb-2">
                  Initial Hexagram Interpretation
                </h3>
                <p className="text-justify">{reading.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-1 sm:mb-2">
                  Changing Line ({reading.line_change.line})
                </h3>
                <p className="text-justify">
                  {reading.line_change.interpretation}
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-1 sm:mb-2">
                  Resulting Hexagram ({reading.result.name})
                </h3>
                <p className="text-justify">{reading.result.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-1 sm:mb-2">Advice</h3>
                <p className="text-justify">{reading.advice}</p>
              </div>
            </div>
          </div>

          {/* Clarification Section */}
          <AnimatePresence mode="wait">
            {!clarificationAnswer ? (
              <motion.div
                key="clarification-input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 mt-6 sm:mt-8"
              >
                <h3 className="text-white text-lg sm:text-xl font-serif">
                  Need Clarification?
                </h3>
                <Textarea
                  value={clarificationInput}
                  onChange={(e) => setClarificationInput(e.target.value)}
                  placeholder="Ask a follow-up question about your reading..."
                  className="w-full min-h-[100px] bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-xl p-4 sm:p-6 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none font-serif text-sm sm:text-base"
                  rows={3}
                />
                <div className="flex justify-center">
                  <Button
                    onClick={handleClarificationSubmit}
                    disabled={
                      !clarificationInput.trim() ||
                      clarificationMutation.isPending ||
                      isMutationInProgress
                    }
                    className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold"
                  >
                    {clarificationMutation.isPending || isMutationInProgress
                      ? "Getting Clarification..."
                      : "Get Clarification"}
                  </Button>
                </div>
                {clarificationMutation.error && (
                  <p className="text-red-500 text-sm">
                    {(clarificationMutation.error as Error).message}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="clarification-answer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 sm:mt-8 bg-[#D8CDBA] rounded-lg p-4 sm:p-6 font-serif"
              >
                <h3 className="font-bold mb-2 text-base sm:text-lg">
                  Clarification
                </h3>
                <p className="italic mb-3 text-sm sm:text-base">
                  Q: {reading.clarifying_question}
                </p>
                <p className="text-justify text-sm sm:text-base">
                  {clarificationAnswer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New Reading Button - Only show after clarification is answered */}
          {clarificationAnswer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center mt-8 sm:mt-12"
            >
              <Button
                onClick={() => router.push("/try-now")}
                className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-8 py-3 rounded-full text-base font-semibold"
              >
                New Reading
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
