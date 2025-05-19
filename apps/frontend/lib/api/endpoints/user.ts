import axios from "axios";
import { ErrorResponse } from "@/types/auth";
import { UserReadingHistoryEntry } from "@/types/divination";
import {
  FrontendUserProfileStatusResponse,
  FrontendUserProfileResponse,
  PaginatedUserReadingsResponse,
} from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const userApi = {
  /**
   * Get historical readings for the authenticated user.
   * This function is intended for client-side usage if needed later.
   * The ReadingsHistoryPage uses server-side fetching instead.
   * @param options Pagination options
   * @returns Paginated response with user readings and pagination metadata
   */
  async getUserReadings(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedUserReadingsResponse> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;

    try {
      const response = await axios.get<PaginatedUserReadingsResponse>(
        `${API_URL}/api/user/readings?page=${page}&limit=${limit}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Send cookies for authentication
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error fetching user readings:", error);
      // Handle axios errors
      if (error?.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage =
          errorData.detail || "Failed to fetch user readings";
        throw new Error(errorMessage);
      }
      throw new Error("Failed to fetch user readings. Please try again later.");
    }
  },

  /**
   * Delete a specific reading by ID.
   * @param readingId The UUID of the reading to delete
   * @returns Success response with the deleted reading ID
   */
  async deleteReading(
    readingId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(
        `${API_URL}/api/user/readings/${readingId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Send cookies for authentication
        },
      );
      return response.data;
    } catch (error: any) {
      console.error(`API Error deleting reading ${readingId}:`, error);
      // Handle axios errors
      if (error?.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage = errorData.detail || "Failed to delete reading";
        throw new Error(errorMessage);
      }
      throw new Error("Failed to delete reading. Please try again later.");
    }
  },

  /**
   * Delete all readings for the authenticated user.
   * @returns Success response
   */
  async deleteAllReadings(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_URL}/api/user/readings`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // Send cookies for authentication
      });
      return response.data;
    } catch (error: any) {
      console.error("API Error deleting all readings:", error);
      // Handle axios errors
      if (error?.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage =
          errorData.detail || "Failed to delete all readings";
        throw new Error(errorMessage);
      }
      throw new Error("Failed to delete all readings. Please try again later.");
    }
  },

  /**
   * Upgrade the authenticated user's membership to premium status.
   * This will set their membership type to 'premium' and update their profile.
   */
  async upgradeToPremium(): Promise<FrontendUserProfileResponse> {
    try {
      const response = await axios.post<FrontendUserProfileResponse>(
        `${API_URL}/api/user/profile/upgrade`,
        {}, // No request body needed
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Send cookies for authentication
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error upgrading membership:", error);
      // Handle axios errors
      if (error?.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage = errorData.detail || "Failed to upgrade membership";

        // Throw the specific error message from the backend
        throw new Error(errorMessage);
      }
      throw new Error("Failed to upgrade membership. Please try again later.");
    }
  },

  /**
   * Get a specific reading by ID for the authenticated user.
   * @param readingId The UUID of the reading to fetch
   * @returns The requested reading if found
   */
  async getUserReadingById(
    readingId: string,
  ): Promise<UserReadingHistoryEntry> {
    try {
      const response = await axios.get<UserReadingHistoryEntry>(
        `${API_URL}/api/user/readings/${readingId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Send cookies for authentication
        },
      );
      return response.data;
    } catch (error: any) {
      console.error(`API Error fetching reading ${readingId}:`, error);
      // Handle axios errors
      if (error?.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage = errorData.detail || "Failed to fetch reading";
        throw new Error(errorMessage);
      }
      throw new Error("Failed to fetch reading. Please try again later.");
    }
  },

  /**
   * Get the current user's profile status including membership and quota information.
   * @returns User profile status response including membership type and quotas
   */
  async getUserProfileStatus(): Promise<FrontendUserProfileStatusResponse> {
    try {
      const response = await axios.get<FrontendUserProfileStatusResponse>(
        `${API_URL}/api/user/profile`,
        {
          withCredentials: true, // Send cookies for authentication
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error fetching user profile status:", error);
      // Handle axios errors
      if (error?.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage =
          errorData.detail || "Failed to fetch profile status";
        throw new Error(errorMessage);
      }
      throw new Error(
        "Failed to fetch profile status. Please try again later.",
      );
    }
  },

  // Add other user-related API functions here if needed (e.g., get quota)
  // async getUserQuota(userId: string): Promise<any> { ... }
};
