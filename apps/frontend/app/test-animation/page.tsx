"use client";

import { useState, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import AnimatedHexagram from "@/components/divination/AnimatedHexagram";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getInitialHexagramLines,
  getFinalHexagramLines,
} from "@/lib/divinationUtils";

export default function TestAnimationPage() {
  const [parentCoord, setParentCoord] = useState("4-5");
  const [childCoord, setChildCoord] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const validateAndSetParentCoord = useCallback((value: string) => {
    // Allow empty input for typing
    if (!value) {
      setParentCoord(value);
      setError(
        "Please enter a parent coordinate in the format 'X-Y' where X and Y are digits 0-7",
      );
      return;
    }

    // Allow typing the hyphen
    if (value === "-") {
      setParentCoord(value);
      return;
    }

    // Check format X-Y where X and Y are single digits
    const match = value.match(/^([0-7])-([0-7])$/);
    if (!match) {
      setError(
        "Parent coordinate must be in format 'X-Y' where X and Y are digits 0-7",
      );
    } else {
      setError(null);
    }
    setParentCoord(value);
  }, []);

  const validateAndSetChildCoord = useCallback((value: string) => {
    // Allow empty input for typing
    if (!value) {
      setChildCoord(value);
      setError("Please enter a child coordinate (0-5)");
      return;
    }

    const num = parseInt(value);
    if (isNaN(num) || num < 0 || num > 5) {
      setError("Child coordinate must be a number between 0 and 5");
    } else {
      setError(null);
    }
    setChildCoord(value);
  }, []);

  // Calculate hexagram lines based on inputs
  const initialLines = getInitialHexagramLines(parentCoord);
  const finalLines = getFinalHexagramLines(initialLines, parseInt(childCoord));

  return (
    <PageLayout>
      <ContentContainer>
        <Heading>Test Hexagram Animation</Heading>

        {/* Input Controls */}
        <div className="flex flex-col space-y-4 mb-8 max-w-xs mx-auto mt-8">
          <div>
            <Label htmlFor="parentCoord" className="text-gray-200">
              Parent Coordinate (e.g., &quot;4-5&quot;)
            </Label>
            <Input
              id="parentCoord"
              value={parentCoord}
              onChange={(e) => validateAndSetParentCoord(e.target.value)}
              className="bg-gray-800 text-gray-200 border-gray-700"
              placeholder="X-Y (0-7)"
            />
          </div>
          <div>
            <Label htmlFor="childCoord" className="text-gray-200">
              Child Coordinate (0-5)
            </Label>
            <Input
              id="childCoord"
              value={childCoord}
              onChange={(e) => validateAndSetChildCoord(e.target.value)}
              className="bg-gray-800 text-gray-200 border-gray-700"
              placeholder="0-5"
            />
          </div>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>

        {/* Hexagram Display */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-8 sm:space-y-0 sm:space-x-12">
          <div className="text-center">
            <div className="w-32 h-32">
              <AnimatedHexagram lines={initialLines} />
            </div>
            <p className="text-gray-200 mt-2">Initial Hexagram</p>
          </div>

          <div className="text-brand-button-bg text-3xl sm:text-4xl transform sm:rotate-0 rotate-90">
            →
          </div>

          <div className="text-center">
            <div className="w-32 h-32">
              <AnimatedHexagram lines={finalLines} />
            </div>
            <p className="text-gray-200 mt-2">Final Hexagram</p>
          </div>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
