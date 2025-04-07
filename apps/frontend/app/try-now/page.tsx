'use client';

import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api/endpoints/user';
import { toast } from 'sonner';

export default function TryNowPage() {
  const [question, setQuestion] = useState('');
  const router = useRouter();

  const handleNext = async () => {
    try {
      // Silently check user quota
      const quota = await userApi.getUserQuota();
      
      if (!quota || quota.remaining_queries <= 0) {
        toast.error(
          'You have no remaining readings. Please upgrade your membership to continue.',
          {
            duration: 5000,
            action: {
              label: 'Upgrade',
              onClick: () => router.push('/pricing'),
            },
          }
        );
        return;
      }

      // If we have quota, proceed to enter numbers
      router.push(`/try-now/enter-numbers?question=${encodeURIComponent(question)}`);
    } catch (error) {
      // If there's an error checking quota, just try to proceed
      // The quota check will happen again in the consulting page
      router.push(`/try-now/enter-numbers?question=${encodeURIComponent(question)}`);
    }
  };

  return (
    <PageLayout>
      <div className="flex min-h-screen">
        <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto px-4 py-12">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 font-serif">
            Focus Your Mind
          </h1>

          {/* Instructions */}
          <p className="text-xl text-gray-300 mb-6 font-serif">
            Take a moment, breathe deeply and clearly formulate your question.
          </p>
          <p className="text-xl text-gray-300 mb-12 font-serif">
            Focus your intent on the question for as long as you need.
          </p>

          {/* Question Input */}
          <Textarea
            placeholder="Enter your question clearly here...."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full min-h-[120px] bg-brand-input-bg text-gray-800 placeholder:text-brand-input-text border-none rounded-xl p-6 focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none font-serif text-xl"
            rows={4}
          />

          {/* Next Button */}
          <Button
            onClick={handleNext}
            className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-16 py-3 rounded-full text-lg font-semibold mt-12 w-[200px]"
            disabled={!question.trim()}
          >
            Next
          </Button>
        </div>
      </div>
    </PageLayout>
  );
} 