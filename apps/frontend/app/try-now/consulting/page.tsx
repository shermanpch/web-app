"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageLayout from "@/components/layout/PageLayout";
import { useMutation } from "@tanstack/react-query";
import { divinationApi } from "@/lib/api/endpoints/divination";
import { userApi } from "@/lib/api/endpoints/user";
import { authApi } from "@/lib/api/endpoints/auth";
import { motion } from "framer-motion";

export default function ConsultingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMutationStarted, setHasMutationStarted] = useState(false);

  const readingMutation = useMutation({
    mutationFn: async () => {
      const question = searchParams.get("question");
      const n1 = searchParams.get("n1");
      const n2 = searchParams.get("n2");
      const n3 = searchParams.get("n3");

      // Validate parameters
      if (!question || !n1 || !n2 || !n3) {
        throw new Error("Missing required parameters");
      }

      try {
        // Get the reading first
        const readingData = await divinationApi.getIchingReading({
          question,
          first_number: parseInt(n1),
          second_number: parseInt(n2),
          third_number: parseInt(n3),
          language: "English", // Default to English
        });

        return {
          readingData,
          params: {
            question,
            n1: parseInt(n1),
            n2: parseInt(n2),
            n3: parseInt(n3),
          },
        };
      } catch (error) {
        console.error("Error in reading mutation:", error);
        throw error;
      }
    },
    onSuccess: async (result) => {
      const { readingData, params } = result;

      try {
        // Get current user and save reading
        const user = await authApi.getCurrentUser();
        if (user) {
          const saveResponse = await divinationApi.saveIchingReading({
            user_id: user.id,
            question: params.question,
            first_number: params.n1,
            second_number: params.n2,
            third_number: params.n3,
            language: "English",
            prediction: readingData,
          });

          // Only decrement quota after successful save
          await userApi.decrementQuota();

          // Navigate to result page with just the reading ID
          router.replace(`/try-now/result?id=${saveResponse.id}`);
        }
      } catch (saveError) {
        console.error("Error saving reading:", saveError);
        // If saving fails, show error and redirect back
        setErrorMessage("Failed to save your reading. Please try again.");
        setTimeout(() => router.replace("/try-now"), 3000);
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error.message || "An error occurred while getting your reading";
      setErrorMessage(errorMsg);

      if (errorMsg === "Missing required parameters") {
        router.replace("/try-now"); // Redirect back to start
      }
      console.error("Error in consulting flow:", error);
    },
  });

  useEffect(() => {
    // Prevent multiple API calls with this flag
    if (!hasMutationStarted) {
      setHasMutationStarted(true);
      // Start the reading process
      readingMutation.mutate();
    }

    // Clean up function to prevent issues during unmount
    return () => {
      // Can add cleanup logic here if needed
    };
  }, [readingMutation, hasMutationStarted]);

  return (
    <PageLayout>
      <div className="flex min-h-screen bg-[#0A0D0A] absolute inset-0">
        <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          {errorMessage ? (
            <div className="text-red-500 mb-4">{errorMessage}</div>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 sm:mb-12 md:mb-16 font-serif">
                Consulting the Oracle...
              </h1>

              <div className="flex flex-col md:flex-row items-center justify-center md:space-x-8 lg:space-x-24 space-y-8 md:space-y-0">
                {/* Turtle Shell */}
                <motion.div
                  className="relative w-[16rem] h-[16rem] sm:w-[24rem] sm:h-[24rem] md:w-[32rem] md:h-[32rem] lg:w-[36rem] lg:h-[36rem]"
                  animate={{
                    rotate: [-15, 15, -15, 15, -15, 15, -15],
                  }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  }}
                >
                  <Image
                    src="/assets/turtle-shell.png"
                    alt="Turtle Shell"
                    width={576}
                    height={576}
                    className="w-full h-full object-contain"
                    priority
                  />
                  {/* Add a subtle shadow that moves with the shell */}
                  <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 w-[80%] sm:w-[85%] h-4 sm:h-6 bg-black/20 rounded-full blur-md" />
                </motion.div>

                {/* Coins */}
                <div className="flex flex-row space-x-4 sm:space-x-8 md:space-x-12">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      className="relative w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.6 + index * 0.3,
                        duration: 0.3,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                        ease: "easeOut",
                      }}
                    >
                      <Image
                        src={
                          index % 2 === 0
                            ? "/assets/coin-head.png"
                            : "/assets/coin-tail.png"
                        }
                        alt={`Coin ${index + 1}`}
                        width={160}
                        height={160}
                        className="w-full h-full object-contain"
                        priority
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
