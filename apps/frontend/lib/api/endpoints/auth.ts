import axios from "axios";
import {
  LoginCredentials,
  SignUpCredentials,
  UserSessionResponse,
  ErrorResponse,
} from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export const authApi = {
  /**
   * Register a new user with email and password
   */
  async signup(credentials: SignUpCredentials): Promise<UserSessionResponse> {
    try {
      const response = await axios.post<UserSessionResponse>(
        `${API_BASE_URL}/api/auth/signup`,
        credentials,
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
            : "Failed to create account");

        throw new Error(errorMessage);
      }

      throw new Error("Failed to create account. Please try again later.");
    }
  },

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<UserSessionResponse> {
    try {
      const response = await axios.post<UserSessionResponse>(
        `${API_BASE_URL}/api/auth/login`,
        credentials,
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
            : "Authentication failed");

        throw new Error(errorMessage);
      }

      throw new Error("Failed to authenticate. Please try again later.");
    }
  },

  /**
   * Logout current user by calling the server logout endpoint
   */
  async logout(): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error("Error during server logout:", error);
      // Still resolve the promise to allow client-side logout to complete
    }
  },

  /**
   * Change user password
   */
  async changePassword(password: string, accessToken?: string): Promise<void> {
    try {
      const payload = accessToken
        ? { password, access_token: accessToken }
        : { password };

      await axios.post(`${API_BASE_URL}/api/auth/password/change`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
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
            : "Password change failed");

        throw new Error(errorMessage);
      }

      throw new Error("Failed to change password. Please try again later.");
    }
  },

  /**
   * Request a password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/password/reset`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
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
            : "Failed to request password reset");

        throw new Error(errorMessage);
      }

      throw new Error(
        "Failed to request password reset. Please try again later.",
      );
    }
  },

  /**
   * Reset password using the Supabase token
   */
  async resetPassword(password: string, accessToken: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/password/change`,
        {
          password,
          access_token: accessToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
    } catch (error: any) {
      // Handle axios errors
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;

        // Create a more specific error with the backend message
        const errorMessage =
          errorData.detail ||
          errorData.message ||
          (errorData.errors
            ? Object.values(errorData.errors).flat().join(", ")
            : "Failed to reset password");

        throw new Error(errorMessage);
      }

      throw new Error("Failed to reset password. Please try again later.");
    }
  },

  /**
   * Get current user information using auth cookie
   */
  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  },
};
