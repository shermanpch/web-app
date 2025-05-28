import axios from "axios";
import {
  LoginCredentials,
  SignUpCredentials,
  UserSessionResponse,
  ErrorResponse,
} from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const INTERNAL_API_URL = process.env.INTERNAL_BACKEND_API_URL || API_URL;

export const authApi = {
  /**
   * Register a new user with email and password
   */
  async signup(credentials: SignUpCredentials): Promise<UserSessionResponse> {
    try {
      const response = await axios.post<UserSessionResponse>(
        `${API_URL}/api/auth/signup`,
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
        `${API_URL}/api/auth/login`,
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
        `${API_URL}/api/auth/logout`,
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
   * @param newPassword - The new password to set
   * @param currentPassword - The current password for verification (required for logged-in users)
   * @param accessToken - Optional access token for password reset flow
   */
  async changePassword(
    newPassword: string,
    currentPassword?: string,
    accessToken?: string,
  ): Promise<void> {
    try {
      let payload: any = {};

      // The backend endpoint expects a simple { password: string } for logged-in users
      // and { password: string, access_token: string } for password reset flow
      if (accessToken) {
        // Password reset flow
        payload = { password: newPassword, access_token: accessToken };
      } else {
        // For logged-in users, we only need to send the new password
        // The backend uses the auth cookies for verification
        payload = { password: newPassword };
      }

      await axios.post(`${API_URL}/api/auth/password/change`, payload, {
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
        `${API_URL}/api/auth/password/reset`,
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
        `${API_URL}/api/auth/password/change`,
        {
          password,
          access_token: accessToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
   * Get current user data - can be used both client and server side
   * @param authToken Optional auth token for server-side calls
   */
  async getCurrentUser(authToken?: string) {
    try {
      const config: any = {
        withCredentials: true,
      };

      // If auth token is provided (server-side), add it to headers
      if (authToken) {
        config.headers = {
          Cookie: `auth_token=${authToken}`,
        };
      }

      // Use internal URL for server-side calls
      const baseUrl =
        typeof window === "undefined" ? INTERNAL_API_URL : API_URL;
      const response = await axios.get(`${baseUrl}/api/auth/me`, config);
      return response.data;
    } catch (error: any) {
      // Return null for 401 Unauthorized (not logged in)
      if (error?.response?.status === 401) {
        return null;
      }

      // For other errors, log and rethrow
      console.error("Error fetching current user:", error);
      throw error;
    }
  },

  /**
   * Resend confirmation email for unconfirmed user
   */
  async resendConfirmationEmail(email: string): Promise<void> {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/resend-confirmation`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      
      // The backend returns 200 with a generic success message for security reasons
      // Rate limiting and other errors are only logged on the backend side
      // We rely on client-side rate limiting to prevent the backend rate limit
      
    } catch (error: any) {
      // Handle axios errors (actual HTTP errors)
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;

        // Try multiple possible error message fields
        const errorMessage =
          errorData.detail ||
          errorData.message ||
          errorData.error_description ||
          (errorData.errors
            ? Object.values(errorData.errors).flat().join(", ")
            : null);

        if (errorMessage) {
          throw new Error(errorMessage);
        }
      }

      // If we have a response but no structured error data, try to extract the error
      if (error?.response) {
        const statusCode = error.response.status;
        const statusText = error.response.statusText;
        
        // Handle different status codes
        if (statusCode === 429) {
          throw new Error("Too many requests. Please wait a moment before trying again.");
        } else if (statusCode >= 400 && statusCode < 500) {
          throw new Error(`Request failed: ${statusText || 'Client error'}`);
        } else if (statusCode >= 500) {
          throw new Error(`Server error: ${statusText || 'Internal server error'}`);
        }
      }

      // If it's already an Error object (thrown above), re-throw it
      if (error instanceof Error) {
        throw error;
      }

      // Fallback error message
      throw new Error("Failed to resend confirmation email. Please try again later.");
    }
  },
};
