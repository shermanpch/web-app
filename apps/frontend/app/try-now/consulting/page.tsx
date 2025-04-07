'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import PageLayout from '@/components/layout/PageLayout';
import { usePageState } from '@/hooks/use-page-state';
import { divinationApi } from '@/lib/api/endpoints/divination';
import { userApi } from '@/lib/api/endpoints/user';
import { authApi } from '@/lib/api/endpoints/auth';
import type { DivinationResponse } from '@/types/divination';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    data: readingResult, 
    setData: setReadingResult, 
    isLoading, 
    error, 
    setError, 
    withLoadingState 
  } = usePageState<DivinationResponse>();

  useEffect(() => {
    const fetchAndSaveReading = async () => {
      const question = searchParams.get('question');
      const n1 = searchParams.get('n1');
      const n2 = searchParams.get('n2');
      const n3 = searchParams.get('n3');

      // Validate parameters
      if (!question || !n1 || !n2 || !n3) {
        setError('Missing required parameters');
        router.push('/try-now'); // Redirect back to start
        return;
      }

      await withLoadingState(async () => {
        try {
          // Get the reading first
          const readingData = await divinationApi.getIchingReading({
            question,
            first_number: parseInt(n1),
            second_number: parseInt(n2),
            third_number: parseInt(n3),
            language: 'en' // Default to English
          });

          // Only decrement quota after successful reading
          await userApi.decrementQuota();

          setReadingResult(readingData);

          // Get current user and save reading
          try {
            const user = await authApi.getCurrentUser();
            if (user) {
              const saveResponse = await divinationApi.saveIchingReading({
                user_id: user.id,
                question,
                first_number: parseInt(n1),
                second_number: parseInt(n2),
                third_number: parseInt(n3),
                language: 'en',
                prediction: readingData
              });

              // Navigate to result page with both reading data and ID
              const readingDataString = JSON.stringify({
                ...readingData,
                reading_id: saveResponse.id // Add the reading ID to the data
              });
              router.push(`/try-now/result?reading=${encodeURIComponent(readingDataString)}`);
            }
          } catch (saveError) {
            console.error('Error saving reading:', saveError);
            // If saving fails, still navigate but without the reading ID
            const readingDataString = JSON.stringify(readingData);
            router.push(`/try-now/result?reading=${encodeURIComponent(readingDataString)}`);
          }
        } catch (error: any) {
          setError(error.message || 'An error occurred while getting your reading');
          console.error('Error in consulting flow:', error);
        }
      });
    };

    fetchAndSaveReading();
  }, [router, searchParams, withLoadingState, setError, setReadingResult]);

  return (
    <PageLayout>
      <div className="flex min-h-screen bg-[#0A0D0A] absolute inset-0">
        <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-4 py-12 relative z-10">
          {error ? (
            <div className="text-red-500 mb-4">{error}</div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-16 font-serif">
                Consulting the Oracle...
              </h1>

              <div className="flex items-center justify-center space-x-24">
                {/* Turtle Shell */}
                <motion.div
                  className="relative w-[36rem] h-[36rem]"
                  animate={{
                    rotate: [-15, 15, -15, 15, -15, 15, -15]
                  }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1]
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
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[30rem] h-6 bg-black/20 rounded-full blur-md" />
                </motion.div>

                {/* Coins */}
                <div className="flex space-x-12">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      className="relative w-40 h-40"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.6 + (index * 0.3),
                        duration: 0.3,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                        ease: "easeOut"
                      }}
                    >
                      <Image
                        src={index % 2 === 0 ? "/assets/coin-head.png" : "/assets/coin-tail.png"}
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