"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function EnterNumbersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const question = searchParams.get("question") || "";

  const [firstNumber, setFirstNumber] = useState("");
  const [secondNumber, setSecondNumber] = useState("");
  const [thirdNumber, setThirdNumber] = useState("");
  const [firstNumberError, setFirstNumberError] = useState<string | null>(null);
  const [secondNumberError, setSecondNumberError] = useState<string | null>(
    null,
  );
  const [thirdNumberError, setThirdNumberError] = useState<string | null>(null);

  const validateNumber = (value: string): string | null => {
    if (!value) return null;
    if (!/^\d+$/.test(value)) return "Please enter a valid number";
    const num = parseInt(value);
    if (num < 0) return "Number must be 0 or greater";
    if (num > 999) return "Number must be 999 or less";
    return null;
  };

  const isValidNumber = (num: string) => {
    const parsed = parseInt(num);
    return !isNaN(parsed) && parsed >= 0 && parsed <= 999;
  };

  const handleNumberChange = (
    _value: string,
    _setter: (_value: string) => void,
    _errorSetter: (_error: string | null) => void,
  ) => {
    _setter(_value);
    const validationError = validateNumber(_value);
    _errorSetter(validationError);
  };

  const isFormValid =
    isValidNumber(firstNumber) &&
    isValidNumber(secondNumber) &&
    isValidNumber(thirdNumber);

  const handleNumberSubmit = () => {
    if (!isFormValid) return;

    // Ensure numbers are padded to 3 digits for consistency
    const padNumber = (num: string) =>
      parseInt(num).toString().padStart(3, "0");

    router.replace(
      `/try-now/consulting?question=${encodeURIComponent(question)}&n1=${padNumber(firstNumber)}&n2=${padNumber(secondNumber)}&n3=${padNumber(thirdNumber)}`,
    );
  };

  return (
    <PageLayout>
      <ContentContainer>
        <Heading>Focus Your Mind</Heading>

        {/* Instructions */}
        <p className="text-xl text-gray-200 font-serif leading-relaxed text-left mb-6">
          Take a moment, breathe deeply, and focus on your question.
        </p>
        <p className="text-xl text-gray-200 font-serif leading-relaxed text-left mb-12">
          Then, think of three random 3-digit numbers and enter them below.
        </p>

        {/* Number Inputs */}
        <div className="w-full max-w-xs mx-auto space-y-8">
          <div>
            <Label
              htmlFor="firstNumber"
              className="text-gray-400 font-serif mb-2 block"
            >
              First Number
            </Label>
            <Input
              id="firstNumber"
              type="number"
              min="0"
              max="999"
              placeholder="Enter first number (0-999)"
              value={firstNumber}
              onChange={(e) =>
                handleNumberChange(
                  e.target.value,
                  setFirstNumber,
                  setFirstNumberError,
                )
              }
              className="bg-brand-input-bg placeholder:text-brand-input-text text-gray-800 rounded-full px-6 py-3 border-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none w-full"
            />
            {firstNumberError && (
              <p className="text-red-500 text-sm mt-2">{firstNumberError}</p>
            )}
          </div>

          <div>
            <Label
              htmlFor="secondNumber"
              className="text-gray-400 font-serif mb-2 block"
            >
              Second Number
            </Label>
            <Input
              id="secondNumber"
              type="number"
              min="0"
              max="999"
              placeholder="Enter second number (0-999)"
              value={secondNumber}
              onChange={(e) =>
                handleNumberChange(
                  e.target.value,
                  setSecondNumber,
                  setSecondNumberError,
                )
              }
              className="bg-brand-input-bg placeholder:text-brand-input-text text-gray-800 rounded-full px-6 py-3 border-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none w-full"
            />
            {secondNumberError && (
              <p className="text-red-500 text-sm mt-2">{secondNumberError}</p>
            )}
          </div>

          <div>
            <Label
              htmlFor="thirdNumber"
              className="text-gray-400 font-serif mb-2 block"
            >
              Third Number
            </Label>
            <Input
              id="thirdNumber"
              type="number"
              min="0"
              max="999"
              placeholder="Enter third number (0-999)"
              value={thirdNumber}
              onChange={(e) =>
                handleNumberChange(
                  e.target.value,
                  setThirdNumber,
                  setThirdNumberError,
                )
              }
              className="bg-brand-input-bg placeholder:text-brand-input-text text-gray-800 rounded-full px-6 py-3 border-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button-bg focus:outline-none w-full"
            />
            {thirdNumberError && (
              <p className="text-red-500 text-sm mt-2">{thirdNumberError}</p>
            )}
          </div>
        </div>

        {/* Next Button */}
        <div className="text-center">
          <Button
            onClick={handleNumberSubmit}
            disabled={!isFormValid}
            className="bg-brand-button-bg hover:bg-brand-button-hover text-white px-16 py-3 rounded-full text-lg font-semibold mt-12 w-[200px]"
          >
            Next
          </Button>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
