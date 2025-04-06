"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { divinationApi } from "@/lib/api/endpoints/divination";
import { userApi } from "@/lib/api/endpoints/user";
import {
  DivinationResponse,
  SaveReadingResponse,
  UpdateReadingResponse,
  IChingPrediction,
} from "@/types/divination";
import { UpdateUserQuotaResponse } from "@/types/user";
import { usePageState } from "@/hooks/use-page-state";
import { cn } from "@/lib/utils";

// Define props interface
interface DivinationFormProps {
  userId: string; // Accept userId as a prop
}

export function DivinationForm({ userId }: DivinationFormProps) {
  const {
    data: response,
    isLoading: isResponseLoading,
    error,
    withLoadingState,
    setData,
  } = usePageState<DivinationResponse>();

  const {
    data: saveResponse,
    isLoading: isSaving,
    error: saveError,
    withLoadingState: withSaveLoadingState,
    setData: setSaveData,
  } = usePageState<SaveReadingResponse>();

  const {
    data: updateResponse,
    isLoading: isUpdating,
    error: updateError,
    withLoadingState: withUpdateLoadingState,
    setData: setUpdateData,
  } = usePageState<UpdateReadingResponse>();

  const [formState, setFormState] = useState({
    first_number: "",
    second_number: "",
    third_number: "",
    language: "English",
    question: "",
  });

  const [clarifyingQuestion, setClarifyingQuestion] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClarifyingQuestionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setClarifyingQuestion(e.target.value);
  };

  // Save the reading to the database
  const saveReading = async (readingData: DivinationResponse) => {
    setAuthError(null);

    try {
      // Create a prediction object from the reading data
      const prediction: IChingPrediction = {
        hexagram_name: readingData.hexagram_name,
        summary: readingData.summary,
        interpretation: readingData.interpretation,
        line_change: readingData.line_change,
        result: readingData.result,
        advice: readingData.advice,
      };

      const result = await withSaveLoadingState(async () => {
        return await divinationApi.saveIchingReading({
          user_id: userId,
          question: formState.question,
          first_number: parseInt(formState.first_number),
          second_number: parseInt(formState.second_number),
          third_number: parseInt(formState.third_number),
          language: formState.language,
          prediction,
        });
      }, "Failed to save I Ching reading");

      if (result) {
        setSaveData(result);
      }
    } catch (error: any) {
      console.error("Error saving reading:", error);
      setAuthError(error.message);
    }
  };

  // Handle submission of clarifying question
  const handleClarifyingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!saveResponse || !response) {
      setAuthError("Missing required reading data. Please try again.");
      return;
    }

    try {
      // Create prediction object from the response data
      const prediction: IChingPrediction = {
        hexagram_name: response.hexagram_name,
        summary: response.summary,
        interpretation: response.interpretation,
        line_change: response.line_change,
        result: response.result,
        advice: response.advice,
      };

      const updateRequest = {
        id: saveResponse.id,
        user_id: userId,
        question: formState.question,
        first_number: parseInt(formState.first_number),
        second_number: parseInt(formState.second_number),
        third_number: parseInt(formState.third_number),
        language: formState.language,
        prediction,
        clarifying_question: clarifyingQuestion,
      };

      const result = await withUpdateLoadingState(async () => {
        return await divinationApi.updateIchingReading(updateRequest);
      }, "Failed to update I Ching reading with clarifying question");

      if (result) {
        setUpdateData(result);
      }
    } catch (error: any) {
      console.error("Error updating reading with clarifying question:", error);
      setAuthError(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Reset any previous save response and update response
    setSaveData(undefined);
    setUpdateData(undefined);
    // Reset clarifying question
    setClarifyingQuestion("");

    try {
      // First decrement the quota
      try {
        await userApi.decrementQuota();
      } catch (quotaError: any) {
        // If quota decrement fails, show error and don't proceed
        console.error("Quota error:", quotaError);
        setAuthError(`Quota Error: ${quotaError.message}`);
        return;
      }

      const result = await withLoadingState(async () => {
        return await divinationApi.getIchingReading({
          first_number: parseInt(formState.first_number),
          second_number: parseInt(formState.second_number),
          third_number: parseInt(formState.third_number),
          language: formState.language,
          question: formState.question,
        });
      }, "Failed to get I Ching reading");

      // Update the data state with the result if we get one
      if (result) {
        setData(result);

        // After getting a successful reading, save it to the database
        await saveReading(result);
      }
    } catch (error: any) {
      console.error("Error submitting divination:", error);
      setAuthError(error.message);
    }
  };

  const responsePreClass = cn(
    "bg-[hsl(var(--muted))] p-4 rounded-md overflow-auto max-h-[400px]",
  );

  // Disable button if necessary data isn't available or during API calls
  const isSubmitDisabled = isResponseLoading || isSaving;
  const isClarifyDisabled = isUpdating;

  return (
    <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
      {/* Original form section */}
      <div className="w-full md:w-1/2 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auth error display */}
          {authError && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md mb-4">
              {authError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="first_number">First Number (0-999)</Label>
              <Input
                id="first_number"
                name="first_number"
                type="number"
                min="0"
                max="999"
                value={formState.first_number}
                onChange={handleChange}
                required
                placeholder="Enter first number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="second_number">Second Number (0-999)</Label>
              <Input
                id="second_number"
                name="second_number"
                type="number"
                min="0"
                max="999"
                value={formState.second_number}
                onChange={handleChange}
                required
                placeholder="Enter second number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="third_number">Third Number (0-999)</Label>
              <Input
                id="third_number"
                name="third_number"
                type="number"
                min="0"
                max="999"
                value={formState.third_number}
                onChange={handleChange}
                required
                placeholder="Enter third number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              name="language"
              value={formState.language}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input-background))] text-[hsl(var(--input-foreground))] px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
              required
            >
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <textarea
              id="question"
              name="question"
              value={formState.question}
              onChange={handleChange}
              required
              placeholder="Enter your question"
              className="flex min-h-[100px] w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input-background))] text-[hsl(var(--input-foreground))] px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
            />
          </div>

          {error && (
            <div className="text-[hsl(var(--destructive))] text-sm">
              {error}
            </div>
          )}

          <div>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isResponseLoading
                ? "Getting Reading..."
                : isSaving
                  ? "Saving..."
                  : "Submit"}
            </Button>
          </div>
        </form>

        {/* Reading Response */}
        {response && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">I Ching Reading:</h2>
            <pre className={responsePreClass}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {/* Save Response */}
        {saveResponse && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Save Response:</h2>
            <pre className={responsePreClass}>
              {JSON.stringify(saveResponse, null, 2)}
            </pre>

            {saveError && (
              <div className="text-[hsl(var(--destructive))] text-sm">
                {saveError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clarifying question section */}
      {saveResponse && response && (
        <div className="w-full md:w-1/2 space-y-6">
          <div className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-[hsl(var(--border))] rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              Ask a Clarifying Question
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              Do you need more insight based on your I Ching reading? Ask a
              clarifying question to deepen your understanding.
            </p>

            <form onSubmit={handleClarifyingSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clarifying_question">Clarifying Question</Label>
                <textarea
                  id="clarifying_question"
                  value={clarifyingQuestion}
                  onChange={handleClarifyingQuestionChange}
                  required
                  placeholder="Enter your clarifying question about the reading"
                  className="flex min-h-[120px] w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input-background))] text-[hsl(var(--input-foreground))] px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
                />
              </div>

              {updateError && (
                <div className="text-[hsl(var(--destructive))] text-sm">
                  {updateError}
                </div>
              )}

              <div>
                <Button type="submit" disabled={isClarifyDisabled}>
                  {isUpdating ? "Submitting..." : "Submit Clarifying Question"}
                </Button>
              </div>
            </form>
          </div>

          {/* Update Response */}
          {updateResponse && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">
                Clarification Response:
              </h2>
              <pre className={responsePreClass}>
                {JSON.stringify(updateResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
