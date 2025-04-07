'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EnterNumbersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const question = searchParams.get('question') || '';

  const [firstNumber, setFirstNumber] = useState('');
  const [secondNumber, setSecondNumber] = useState('');
  const [thirdNumber, setThirdNumber] = useState('');

  const isValidNumber = (num: string) => {
    const parsed = parseInt(num);
    return !isNaN(parsed) && parsed >= 0 && parsed <= 999;
  };
  const isFormValid = isValidNumber(firstNumber) && isValidNumber(secondNumber) && isValidNumber(thirdNumber);

  const handleNumberSubmit = () => {
    if (!isFormValid) return;
    
    // Ensure numbers are padded to 3 digits for consistency
    const padNumber = (num: string) => parseInt(num).toString().padStart(3, '0');
    
    router.push(
      `/try-now/consulting?question=${encodeURIComponent(question)}&n1=${padNumber(firstNumber)}&n2=${padNumber(secondNumber)}&n3=${padNumber(thirdNumber)}`
    );
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
            Take a moment, breathe deeply, and focus on your question.
          </p>
          <p className="text-xl text-gray-300 mb-12 font-serif">
            Then, think of three random 3-digit numbers and enter them below.
          </p>

          {/* Number Inputs */}
          <div className="w-full max-w-xs mx-auto space-y-8">
            <div>
              <Label htmlFor="firstNumber" className="text-gray-400 font-serif mb-2 block">
                First Number
              </Label>
              <Input
                id="firstNumber"
                type="number"
                min="0"
                max="999"
                placeholder="Enter first number (0-999)"
                value={firstNumber}
                onChange={(e) => setFirstNumber(e.target.value)}
                className="bg-brand-input-bg placeholder:text-brand-input-text text-gray-800 rounded-full px-6 py-3 border-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none w-full"
              />
            </div>

            <div>
              <Label htmlFor="secondNumber" className="text-gray-400 font-serif mb-2 block">
                Second Number
              </Label>
              <Input
                id="secondNumber"
                type="number"
                min="0"
                max="999"
                placeholder="Enter second number (0-999)"
                value={secondNumber}
                onChange={(e) => setSecondNumber(e.target.value)}
                className="bg-brand-input-bg placeholder:text-brand-input-text text-gray-800 rounded-full px-6 py-3 border-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none w-full"
              />
            </div>

            <div>
              <Label htmlFor="thirdNumber" className="text-gray-400 font-serif mb-2 block">
                Third Number
              </Label>
              <Input
                id="thirdNumber"
                type="number"
                min="0"
                max="999"
                placeholder="Enter third number (0-999)"
                value={thirdNumber}
                onChange={(e) => setThirdNumber(e.target.value)}
                className="bg-brand-input-bg placeholder:text-brand-input-text text-gray-800 rounded-full px-6 py-3 border-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Next Button */}
          <Button
            onClick={handleNumberSubmit}
            disabled={!isFormValid}
            className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-16 py-3 rounded-full text-lg font-semibold mt-12 w-[200px]"
          >
            Next
          </Button>
        </div>
      </div>
    </PageLayout>
  );
} 