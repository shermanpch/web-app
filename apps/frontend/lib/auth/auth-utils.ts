import { secureStorage } from "./secure-storage";
import { Session, User } from "@/types/auth";

/**
 * Type for stored auth data
 */
interface StoredAuthData {
  user: User;
  session: Session;
}

/**
 * Utility to check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return secureStorage.hasAuthData();
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  const authData = secureStorage.getAuthData<StoredAuthData>();

  if (!authData) return null;

  // Check if token is expiring soon
  if (secureStorage.isTokenExpiringSoon(authData.session.expires_in)) {
    // In a real application, you would refresh the token here
    console.warn("Token is expiring soon, consider refreshing");
  }

  return authData.session.access_token;
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  secureStorage.clear();
}
