import { cookies } from "next/headers";
import { authApi } from "./auth";

export const serverAuthApi = {
  /**
   * Server-side only function to get current user
   */
  async getCurrentUser() {
    try {
      const cookieStore = await cookies();
      const authToken = cookieStore.get('auth_token')?.value;
      
      if (!authToken) {
        return null;
      }

      return authApi.getCurrentUser(authToken);
    } catch (error) {
      console.error("Error accessing cookies:", error);
      return null;
    }
  },
}; 