import { useState, useCallback } from "react";

interface UsePageStateProps<T = undefined> {
  initialState?: T;
  initialError?: string | null;
  initialLoading?: boolean;
}

/**
 * A hook for managing common page state including loading, error and data
 *
 * @example
 * // Basic usage
 * const {
 *   data, setData,
 *   error, setError,
 *   isLoading, startLoading, stopLoading,
 *   withLoadingState
 * } = usePageState<UserData>();
 *
 * // Use the withLoadingState helper for async operations
 * const handleSubmit = async () => {
 *   await withLoadingState(async () => {
 *     const userData = await fetchUserData();
 *     setData(userData);
 *   }, 'Failed to fetch user data', true); // Custom error message and propagate error
 * };
 */
export function usePageState<T = undefined>({
  initialState,
  initialError = null,
  initialLoading = false,
}: UsePageStateProps<T> = {}) {
  const [data, setData] = useState<T | undefined>(initialState);
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  const clearError = useCallback(() => setError(null), []);
  const reset = useCallback(() => {
    setData(initialState);
    setError(initialError);
    setIsLoading(initialLoading);
  }, [initialState, initialError, initialLoading]);

  /**
   * Utility to wrap async operations with loading state management
   * Handles starting/stopping loading and error management
   *
   * @param asyncOperation The async function to execute
   * @param errorMessage Default error message to show if the error is not an instance of Error
   * @param propagateError Whether to re-throw the error after setting it in state (default: false)
   * @returns The result of the async operation, or undefined if it fails
   */
  const withLoadingState = useCallback(
    async <R>(
      asyncOperation: () => Promise<R>,
      errorMessage = "An unexpected error occurred",
      propagateError = false,
    ): Promise<R | undefined> => {
      try {
        startLoading();
        clearError();
        const result = await asyncOperation();
        return result;
      } catch (err) {
        // Format the error message
        let message = errorMessage;
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === "string") {
          message = err;
        } else if (typeof err === "object" && err !== null) {
          message = JSON.stringify(err);
        }

        // Set error state and log to console
        setError(message);
        console.error("Operation failed:", err);

        // Re-throw the error if propagation is enabled
        if (propagateError) {
          throw err;
        }

        return undefined;
      } finally {
        stopLoading();
      }
    },
    [startLoading, clearError, stopLoading],
  );

  return {
    data,
    setData,
    error,
    setError,
    clearError,
    isLoading,
    startLoading,
    stopLoading,
    reset,
    withLoadingState,
  };
}
