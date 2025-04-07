'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePageState } from '@/hooks/use-page-state';
import { divinationApi } from '@/lib/api/endpoints/divination';
import { authApi } from '@/lib/api/endpoints/auth';
import type { DivinationResponse } from '@/types/divination';

interface ExtendedDivinationResponse extends DivinationResponse {
  reading_id?: string;
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const [reading, setReading] = useState<ExtendedDivinationResponse | null>(null);
  const [clarificationInput, setClarificationInput] = useState('');
  const [clarificationAnswer, setClarificationAnswer] = useState<string | null>(null);
  
  const { 
    isLoading: isClarifying,
    error: clarificationError,
    setError: setClarificationError,
    withLoadingState: withClarificationLoading
  } = usePageState<string>();

  useEffect(() => {
    const readingString = searchParams.get('reading');
    if (readingString) {
      try {
        const parsedReading = JSON.parse(decodeURIComponent(readingString));
        setReading(parsedReading as ExtendedDivinationResponse);
      } catch (error) {
        console.error('Error parsing reading:', error);
      }
    }
  }, [searchParams]);

  const handleClarificationSubmit = async () => {
    if (!reading || !clarificationInput.trim()) return;

    // Early return if reading_id is not available
    if (!reading.reading_id) {
      setClarificationError('Cannot clarify - reading ID not found');
      return;
    }

    setClarificationError(null);
    
    await withClarificationLoading(async () => {
      try {
        // Get current user
        const user = await authApi.getCurrentUser();
        if (!user) {
          throw new Error('User not found');
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
          clarifying_question: clarificationInput
        });

        setClarificationAnswer(updateResponse.clarifying_answer);
        setClarificationInput('');
      } catch (error: any) {
        setClarificationError(error.message || 'Failed to get clarification');
        console.error('Error getting clarification:', error);
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
        <div className="w-full max-w-4xl mx-auto px-4 py-12">
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
              <p className="text-white">Initial Hexagram</p>
            </div>
            
            <div className="text-brand-button-bg text-4xl">→</div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 mb-2"></div>
              <p className="text-white">Final Hexagram</p>
            </div>
          </div>

          {/* Interpretation Card */}
          <div className="bg-[#D8CDBA] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">{reading.hexagram_name}</h2>
            
            <div className="italic mb-6">
              Keywords: {reading.summary}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">Initial Hexagram Interpretation</h3>
                <p>{reading.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Changing Line ({reading.line_change.line})</h3>
                <p>{reading.line_change.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Resulting Hexagram ({reading.result.name})</h3>
                <p>{reading.result.interpretation}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Advice</h3>
                <p>{reading.advice}</p>
              </div>
            </div>
          </div>

          {/* Clarification Section */}
          {clarificationAnswer && (
            <div className="bg-[#D8CDBA] rounded-lg p-8 mb-8">
              <h3 className="font-bold mb-2">Clarification</h3>
              <p>{clarificationAnswer}</p>
            </div>
          )}

          <div className="space-y-4">
            <Textarea
              placeholder="Ask a clarifying question..."
              value={clarificationInput}
              onChange={(e) => setClarificationInput(e.target.value)}
              className="bg-brand-input-bg text-gray-800 border-none focus:ring-2 focus:ring-brand-button-bg"
            />

            {clarificationError && (
              <div className="text-red-500">{clarificationError}</div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={handleClarificationSubmit}
                disabled={isClarifying || !clarificationInput.trim()}
                className="bg-[#5A7D60] hover:bg-[#4A6D50] text-white px-8 py-3 rounded-full text-lg font-semibold"
              >
                Still Unclear?
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 