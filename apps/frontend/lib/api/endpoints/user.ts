import axios from "axios";
import { ErrorResponse } from "@/types/auth";
import { UserReadingHistoryEntry } from "@/types/divination";
import { UpdateUserQuotaResponse } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const userApi = {
  /**
   * Get historical readings for the authenticated user.
   * This function is intended for client-side usage if needed later.
   * The ReadingsHistoryPage uses server-side fetching instead.
   */
  async getUserReadings(): Promise<UserReadingHistoryEntry[]> {
    try {
      const response = await axios.get<UserReadingHistoryEntry[]>(
        `${API_URL}/api/user/readings`,
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
      throw new Error(
        "Failed to fetch user readings. Please try again later.",
      );
    }
  },

  /**
   * Decrement the authenticated user's query quota by 1.
   * This should be called before making a divination or clarification request.
   */
  async decrementQuota(): Promise<UpdateUserQuotaResponse> {
    try {
      const response = await axios.post<UpdateUserQuotaResponse>(
        `${API_URL}/api/user/quota/decrement`,
        {},  // No request body needed
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Send cookies for authentication
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error decrementing user quota:", error);
      // Handle axios errors
      if (error?.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage = errorData.detail || "Failed to decrement quota";
        
        // Throw the specific error message from the backend
        throw new Error(errorMessage);
      }
      throw new Error(
        "Failed to decrement quota. Please try again later.",
      );
    }
  },

  // Add other user-related API functions here if needed (e.g., get quota)
  // async getUserQuota(userId: string): Promise<any> { ... }
}; 