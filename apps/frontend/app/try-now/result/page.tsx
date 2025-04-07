"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePageState } from "@/hooks/use-page-state";
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

  const {
    isLoading: isClarifying,
    error: clarificationError,
    setError: setClarificationError,
    withLoadingState: withClarificationLoading,
  } = usePageState<string>();

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

  const handleClarificationSubmit = async () => {
    if (!reading || !clarificationInput.trim()) return;

    // Early return if reading_id is not available
    if (!reading.reading_id) {
      setClarificationError("Cannot clarify - reading ID not found");
      return;
    }

    setClarificationError(null);

    await withClarificationLoading(async () => {
      try {
        // Get current user
        const user = await authApi.getCurrentUser();
        if (!user) {
          throw new Error("User not found");
        }

        // Update reading with clarification
        const updateResponse = await divinationApi.updateIchingReading({
          id: reading.reading_id as string, // We've already checked it exists above
          user_id: user.id,
          question: reading.question,
          first_number: reading.first_number,
          second_number: reading.second_number,
          third_number: reading.third_number,
          language: reading.language,
          prediction: reading,
          clarifying_question: clarificationInput,
        });

        // Create updated reading object
        const updatedReading = {
          ...reading,
          clarifying_question: clarificationInput,
          clarifying_answer: updateResponse.clarifying_answer
        };
        
        // Update state
        setClarificationAnswer(updateResponse.clarifying_answer);
        setReading(updatedReading);
        setClarificationInput("");
        
        // Update URL with new reading data to persist across navigation
        const readingDataString = JSON.stringify(updatedReading);
        router.replace(
          `/try-now/result?reading=${encodeURIComponent(readingDataString)}`
        );
      } catch (error: any) {
        setClarificationError(error.message || "Failed to get clarification");
        console.error("Error getting clarification:", error);
      }
    });
  };

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
          className="w-full max-w-4xl mx-auto px-4 py-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 font-serif text-center">
            Your Hexagram Result
          </h1>

          {/* Question Display */}
          <div className="text-white text-xl mb-12 text-center font-serif">
            Your Question: {reading.question}
          </div>

          {/* Hexagram Visuals */}
          <div className="flex justify-center items-center space-x-12 mb-12">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 mb-2"></div>
              <p className="text-white font-serif">Initial Hexagram</p>
            </div>

            <div className="text-brand-button-bg text-4xl">→</div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 mb-2"></div>
              <p className="text-white font-serif">Final Hexagram</p>
            </div>
          </div>

          {/* Interpretation Card */}
          <div className="bg-[#D8CDBA] rounded-lg p-8 mb-8 font-serif">
            <h2 className="text-2xl font-bold mb-4">{reading.hexagram_name}</h2>

            <div className="italic mb-6">Keywords: {reading.summary}</div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">
                  Initial Hexagram Interpretation
                </h3>
                <p className="text-justify">{reading.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">
                  Changing Line ({reading.line_change.line})
                </h3>
                <p className="text-justify">{reading.line_change.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">
                  Resulting Hexagram ({reading.result.name})
                </h3>
                <p className="text-justify">{reading.result.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Advice</h3>
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
                className="space-y-4 mt-8"
              >
                <Textarea
                  placeholder="Ask a clarifying question..."
                  value={clarificationInput}
                  onChange={(e) => setClarificationInput(e.target.value)}
                  className="bg-brand-input-bg text-gray-800 border-none focus:ring-2 focus:ring-brand-button-bg font-serif"
                />

                {clarificationError && (
                  <div className="text-red-500 font-serif">{clarificationError}</div>
                )}

                <div className="flex justify-center">
                  <Button
                    onClick={handleClarificationSubmit}
                    disabled={isClarifying || !clarificationInput.trim()}
                    className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-8 py-3 rounded-full text-lg font-semibold font-serif"
                  >
                    {isClarifying ? "Thinking..." : "Still Unclear?"}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="clarification-display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#D8CDBA] rounded-lg p-8 mt-8"
              >
                <h3 className="font-bold mb-2 font-serif">Clarification</h3>
                <p className="italic text-gray-600 mb-4 font-serif">
                  Your question: {reading.clarifying_question || ""}
                </p>
                <p className="font-serif text-justify">{clarificationAnswer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageLayout>
  );
}
