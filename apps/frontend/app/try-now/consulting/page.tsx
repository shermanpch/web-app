"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { divinationApi } from "@/lib/api/endpoints/divination";
import { authApi } from "@/lib/api/endpoints/auth";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import Heading from "@/components/ui/heading";
import { calculateCoordsFromNumbers, getInitialHexagramLines } from "@/lib/divinationUtils";

export default function ConsultingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMutationStarted, setHasMutationStarted] = useState(false);
  const question = searchParams.get("question");
  const n1 = searchParams.get("n1") ? parseInt(searchParams.get("n1")!) : 1;
  const n2 = searchParams.get("n2") ? parseInt(searchParams.get("n2")!) : 2;
  const n3 = searchParams.get("n3") ? parseInt(searchParams.get("n3")!) : 3;
  
  // Loading messages that will cycle
  const loadingMessages = [
    "Interpreting the patterns...",
    "Seeking clarity in the changes...",
    "Aligning with ancient wisdom...",
    "The lines are forming...",
    "Consulting the oracle...",
    "Discerning the meaning..."
  ];
  
  // State for the current message index
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Cycle through loading messages
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3500);
    
    return () => clearInterval(intervalId);
  }, [loadingMessages.length]);

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

          // Invalidate reading history queries to reflect the new reading
          queryClient.invalidateQueries({
            queryKey: ["userReadings"],
            refetchType: "all",
          });

          // Also invalidate the user profile status to update quota numbers
          queryClient.invalidateQueries({
            queryKey: ["userProfileStatus"],
          });

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
    <div className="flex min-h-screen bg-[#0A0D0A] absolute inset-0">
      <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {errorMessage ? (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        ) : (
          <>
            <Heading className="mb-8 sm:mb-10 md:mb-12 text-white">
              Consulting the Oracle...
            </Heading>

            {/* User's Question Display */}
            <p className="text-xl text-gray-300 font-serif text-center mt-2 mb-12">
              Seeking wisdom for: &quot;{question || 'your query'}&quot;
            </p>

            {/* Abstract Loading Animation */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mb-12 relative">
              <AbstractLoadingAnimation n1={n1} n2={n2} n3={n3} />
            </div>

            {/* Cycling Loading Messages */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-lg sm:text-xl text-gray-300 font-serif mt-4"
              >
                {loadingMessages[currentMessageIndex]}
              </motion.p>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// Abstract Loading Animation Component
interface AbstractLoadingAnimationProps {
  n1: number;
  n2: number;
  n3: number;
}

const AbstractLoadingAnimation = ({ n1, n2, n3 }: AbstractLoadingAnimationProps) => {
  // Timing helper function
  const loop = (d: number, ease = "easeInOut") => ({
    duration: d,
    repeat: Infinity,
    ease,
  });
  
  // Orbital particles motion control
  const t = useMotionValue(0);
  useEffect(() => {
    const controls = animate(t, 1, { duration: 12, repeat: Infinity, ease: "linear" });
    return controls.stop; // Cleanup
  }, [t]);
  
  // Calculate hexagram lines based on the three numbers
  const { parentCoord } = calculateCoordsFromNumbers(n1, n2, n3);
  const initialLines = getInitialHexagramLines(parentCoord);
  
  // Convert line types to broken/solid values for our animation
  const hexagramLines = initialLines.map((type: "solid" | "broken", i: number) => ({
    y: i * 24 - 60, // Positioning
    broken: type === "broken"
  }));
  
  // Hexagram line variants for staggered animation
  const lineVariants = {
    initial: { opacity: 0.4, x: 0, scale: 1 },
    animate: { 
      opacity: [0.4, 0.7, 0.4],
      x: [0, 6, -6, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
  };
  
  // Orbit radii for particles
  const orbits = [...Array(12)].map((_, i) => 60 + (i % 3) * 15);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background glow effect */}
      <motion.div
        className="absolute w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={loop(4)}
      />
      
      {/* SVG orbital rings and elements */}
      <svg className="absolute w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="#f59e0b"/>
            <stop offset="80%" stopColor="#d97706"/>
          </radialGradient>
        </defs>
        
        {/* Orbital rings */}
        <motion.circle
          r="80" cx="100" cy="100"
          fill="none" 
          strokeWidth="1"
          stroke="rgba(252, 211, 77, 0.3)"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        
        <motion.circle
          r="60" cx="100" cy="100"
          fill="none" 
          strokeWidth="1"
          stroke="rgba(217, 119, 6, 0.4)"
          animate={{ rotate: -360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        
        <motion.circle
          r="40" cx="100" cy="100"
          fill="none" 
          strokeWidth="1"
          stroke="rgba(245, 158, 11, 0.5)"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        
        {/* Orbital particles */}
        <g>
          {orbits.map((r, i) => {
            // Pre-calculate the transform functions outside the component render
            const angle = t.get() * 360 + i * 30;
            const angleRad = angle * (Math.PI / 180);
            const xPos = 100 + Math.cos(angleRad) * (r * 0.8);
            const yPos = 100 + Math.sin(angleRad) * (r * 0.8);
            
            return (
              <motion.circle 
                key={`particle-${i}`}
                initial={{ cx: xPos, cy: yPos }}
                animate={{ 
                  cx: [xPos, 100 + Math.cos((angle + 360) * (Math.PI / 180)) * (r * 0.8)],
                  cy: [yPos, 100 + Math.sin((angle + 360) * (Math.PI / 180)) * (r * 0.8)]
                }}
                transition={{ 
                  duration: 12, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                r={i % 4 === 0 ? 2 : 1.5}
                fill="#fcd34d"
                style={{ opacity: 0.3 + (i % 5) * 0.1 }}
              />
            );
          })}
        </g>
        
        {/* Hexagram lines - these are the most important elements */}
        <motion.g
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.25 } } }}
        >
          {hexagramLines.map(({ y, broken }: { y: number; broken: boolean }, idx: number) => (
            <React.Fragment key={`hex-line-${idx}`}>
              {broken ? (
                <>
                  <motion.line
                    variants={lineVariants}
                    x1="82" y1={100 + y} x2="94" y2={100 + y}
                    strokeWidth="2.5"
                    stroke="#f59e0b"
                    strokeLinecap="round"
                  />
                  <motion.line
                    variants={lineVariants}
                    x1="106" y1={100 + y} x2="118" y2={100 + y}
                    strokeWidth="2.5"
                    stroke="#f59e0b"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <motion.line
                  variants={lineVariants}
                  x1="82" y1={100 + y} x2="118" y2={100 + y}
                  strokeWidth="2.5"
                  stroke="#f59e0b"
                  strokeLinecap="round"
                />
              )}
            </React.Fragment>
          ))}
        </motion.g>
        
        {/* Center element - without rays */}
        <motion.circle
          r="10" cx="100" cy="100"
          fill="url(#coreGradient)"
          animate={{ 
            r: [10, 12, 10],
            opacity: [0.9, 1, 0.9]
          }}
          transition={loop(3)}
          filter="drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))"
        />
      </svg>
    </div>
  );
};
