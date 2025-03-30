import axios from "axios";
import { ErrorResponse } from "@/types/auth";
import {
  DivinationRequest,
  DivinationResponse,
  SaveReadingRequest,
  SaveReadingResponse,
  UpdateReadingRequest,
  UpdateReadingResponse,
} from "@/types/divination";

export const divinationApi = {
  /**
   * Get I Ching reading
   */
  async getIchingReading(
    request: DivinationRequest,
  ): Promise<DivinationResponse> {
    try {
      const response = await axios.post<DivinationResponse>(
        `/api/divination/iching-reading`,
        request,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      return response.data;
    } catch (error: any) {
      // Handle axios errors
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;

        // Create a more specific error with the backend message
        const errorMessage =
          errorData.detail ||
          (errorData.errors
            ? Object.values(errorData.errors).flat().join(", ")
            : "Failed to get I Ching reading");

        throw new Error(errorMessage);
      }

      throw new Error("Failed to get I Ching reading. Please try again later.");
    }
  },

  /**
   * Save I Ching reading
   */
  async saveIchingReading(
    request: SaveReadingRequest,
  ): Promise<SaveReadingResponse> {
    try {
      const response = await axios.post<SaveReadingResponse>(
        `/api/divination/iching-reading/save`,
        request,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      return response.data;
    } catch (error: any) {
      // Handle axios errors
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;

        // Create a more specific error with the backend message
        const errorMessage =
          errorData.detail ||
          (errorData.errors
            ? Object.values(errorData.errors).flat().join(", ")
            : "Failed to save I Ching reading");

        throw new Error(errorMessage);
      }

      throw new Error(
        "Failed to save I Ching reading. Please try again later.",
      );
    }
  },

  /**
   * Update I Ching reading with clarifying question
   */
  async updateIchingReading(
    request: UpdateReadingRequest,
  ): Promise<UpdateReadingResponse> {
    try {
      const response = await axios.post<UpdateReadingResponse>(
        `/api/divination/iching-reading/update`,
        request,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      return response.data;
    } catch (error: any) {
      // Handle axios errors
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;

        // For validation errors (422), get more details if available
        if (
          error.response.status === 422 &&
          errorData.detail &&
          Array.isArray(errorData.detail)
        ) {
          const validationErrors = errorData.detail
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join("; ");

          throw new Error(`Validation error: ${validationErrors}`);
        }

        // Create a more specific error with the backend message
        const errorMessage =
          errorData.detail ||
          (errorData.errors
            ? Object.values(errorData.errors).flat().join(", ")
            : "Failed to update I Ching reading");

        throw new Error(errorMessage);
      }

      throw new Error(
        "Failed to update I Ching reading. Please try again later.",
      );
    }
  },
};
