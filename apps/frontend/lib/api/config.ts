/**
 * API configuration for handling API endpoints with support for both proxy and direct modes
 */

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";
// Flag to enable/disable API proxy through Netlify
const USE_API_PROXY = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";

/**
 * Get the appropriate API URL based on configuration
 * @param endpoint - The API endpoint path (should always start with "/api/")
 * @returns The complete URL to use for the API call
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with "/api/"
  if (!endpoint.startsWith("/api/")) {
    endpoint = `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }

  // When using proxy, return relative URL
  if (USE_API_PROXY) {
    return endpoint;
  }
  
  // Otherwise, use absolute URL with the backend base
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * API configuration object
 */
export const apiConfig = {
  useProxy: USE_API_PROXY,
  baseUrl: API_BASE_URL,
  getUrl: getApiUrl,
};

export default apiConfig; 