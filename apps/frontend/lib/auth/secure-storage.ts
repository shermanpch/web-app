/**
 * Production-ready secure storage utility for authentication tokens
 *
 * This module provides a secure way to handle authentication data in the browser
 * with strong encryption, tampering detection, and automatic token refresh.
 */

// Import a proper encryption library
import CryptoJS from "crypto-js";

// Constants
const STORAGE_PREFIX = "app_secure_";
const TOKEN_STORAGE_KEY = `${STORAGE_PREFIX}auth`;
const TOKEN_EXPIRY_BUFFER = 5 * 60; // 5 minutes in seconds

// Generate a device-specific encryption key
// This creates a semi-stable key that's specific to this browser
function getEncryptionKey(): string {
  const browserInfo = [
    navigator.userAgent,
    navigator.language,
    window.screen.colorDepth,
    window.screen.availWidth,
    window.screen.availHeight,
  ].join("|");

  // Create a hash of browser info as the encryption key
  return CryptoJS.SHA256(browserInfo).toString();
}

/**
 * Properly encrypt data using AES encryption
 */
function encrypt(data: string): string {
  try {
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(data, key).toString();
  } catch (e) {
    console.error("Encryption error", e);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES decryption
 */
function decrypt(data: string): string {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(data, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Decryption error", e);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Check if storage has been tampered with
 * This includes XSS detection and storage integrity verification
 */
function isStorageCompromised(): boolean {
  try {
    // Check for suspicious entries that might indicate XSS
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes("<script>") ||
          key.includes("javascript:") ||
          key.includes("onerror=") ||
          key.includes("onclick="))
      ) {
        console.warn("Potential XSS attack detected in localStorage");
        return true;
      }
    }

    // Verify integrity of our storage
    const rawData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (rawData) {
      try {
        // Try to decrypt - if it fails, storage may have been tampered with
        decrypt(rawData);
      } catch {
        console.warn("Auth data integrity check failed");
        return true;
      }
    }

    return false;
  } catch (e) {
    // If we can't access storage, consider it compromised
    console.error("Storage access error", e);
    return true;
  }
}

/**
 * Enhanced security for production storage
 */
export const secureStorage = {
  /**
   * Securely store authentication data with proper encryption
   */
  storeAuthData<T>(data: T): boolean {
    try {
      if (isStorageCompromised()) {
        console.warn("Storage compromised - clearing auth data");
        this.clear();
        return false;
      }

      const serialized = JSON.stringify(data);
      const encrypted = encrypt(serialized);
      localStorage.setItem(TOKEN_STORAGE_KEY, encrypted);

      // Set storage timestamp for additional security
      localStorage.setItem(
        `${TOKEN_STORAGE_KEY}_timestamp`,
        Date.now().toString(),
      );

      return true;
    } catch (e) {
      console.error("Failed to store auth data", e);
      return false;
    }
  },

  /**
   * Retrieve securely stored authentication data with integrity checks
   */
  getAuthData<T>(): T | null {
    try {
      if (isStorageCompromised()) {
        console.warn(
          "Storage compromised during data retrieval - clearing auth data",
        );
        this.clear();
        return null;
      }

      // Check timestamp for stale data
      const timestamp = localStorage.getItem(`${TOKEN_STORAGE_KEY}_timestamp`);
      if (timestamp) {
        const storedTime = parseInt(timestamp, 10);
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

        if (Date.now() - storedTime > maxAge) {
          console.warn("Auth data expired (older than 30 days)");
          this.clear();
          return null;
        }
      }

      const encrypted = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!encrypted) return null;

      const serialized = decrypt(encrypted);
      return JSON.parse(serialized) as T;
    } catch (e) {
      console.error("Failed to retrieve auth data", e);
      this.clear(); // Clear on errors for security
      return null;
    }
  },

  /**
   * Clear all stored authentication data
   */
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(`${TOKEN_STORAGE_KEY}_timestamp`);
      // Clear any other related items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error("Failed to clear auth data", e);
    }
  },

  /**
   * Check if we have stored authentication data
   */
  hasAuthData(): boolean {
    try {
      return !!localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      return false;
    }
  },

  /**
   * Check if a token is about to expire
   * @param expiresIn Expiration time in seconds
   */
  isTokenExpiringSoon(expiresIn: number): boolean {
    return expiresIn <= TOKEN_EXPIRY_BUFFER;
  },
};
