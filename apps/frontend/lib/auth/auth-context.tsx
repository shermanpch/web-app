"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "../api/endpoints/auth";
import { secureStorage } from "./secure-storage";
import axios from "axios";
import {
  User,
  Session,
  ExtendedAuthState,
  LoginCredentials,
} from "@/types/auth";

// Auth context type that extends the auth state with methods
interface AuthContextType extends ExtendedAuthState {
  signUp: (_credentials: LoginCredentials) => Promise<void>;
  signIn: (_credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (_password: string) => Promise<void>;
  syncAuthState: () => Promise<boolean>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage type for secure storage
interface StoredAuthData {
  user: User;
  session: Session;
}

const API_BASE_URL = "/api";

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<ExtendedAuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    navigationState: {
      allowUnauthenticatedAccess: false,
    },
  });

  // Track if component is mounted to avoid state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize auth state from storage
  useEffect(() => {
    const storedData = secureStorage.getAuthData<StoredAuthData>();

    if (storedData && storedData.user) {
      setState({
        user: storedData.user,
        session: storedData.session,
        isAuthenticated: true,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: false,
        },
      });
    } else {
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: false,
        },
      });
    }
  }, []);

  // Sync client state with server cookie state on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      syncAuthState();
    }
  }, []); // Run once on mount

  // Add an effect to re-sync when pathname changes to a dashboard route
  useEffect(() => {
    // Skip the initial render
    if (!pathname) return;

    // Only sync data when navigating to dashboard routes
    if (pathname.includes("/dashboard")) {
      // Use a small delay to ensure we don't interfere with the navigation event
      setTimeout(() => {
        if (isMounted.current) {
          syncAuthState();
        }
      }, 100);
    }
  }, [pathname]);

  // Handle visibility changes to sync when returning to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Use a small delay to ensure we don't conflict with other processes
        setTimeout(() => {
          if (isMounted.current) {
            syncAuthState();
          }
        }, 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Sign up function using LoginCredentials type
  const signUp = async (credentials: LoginCredentials) => {
    try {
      // Set loading state
      setState((prev) => ({ ...prev, isLoading: true }));

      // Call signup API
      const response = await authApi.signup(credentials);

      // Store session data securely
      const authData: StoredAuthData = {
        user: response.data.user as User,
        session: response.data.session,
      };

      secureStorage.storeAuthData<StoredAuthData>(authData);

      // Set navigationState to allow redirect without being authenticated
      setState((prev) => ({
        ...prev,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: true,
        },
      }));

      // Redirect to login page after successful signup
      router.push("/login");
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Sign in function using LoginCredentials type
  const signIn = async (credentials: LoginCredentials) => {
    try {
      // Set loading state
      setState((prev) => ({ ...prev, isLoading: true }));

      // Call login API
      const response = await authApi.login(credentials);

      // Extract user and session from response
      const { user, session } = response.data;

      // Store session data securely
      const authData: StoredAuthData = {
        user: user as User,
        session: session,
      };

      secureStorage.storeAuthData<StoredAuthData>(authData);

      // Update state
      setState({
        user: authData.user,
        session: authData.session,
        isAuthenticated: true,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: false,
        },
      });

      // Redirect to dashboard after state is updated
      router.push("/dashboard");
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error; // Re-throw the error so AuthForm can display it
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Immediately clear authentication state first to prevent UI flashes
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,
        navigationState: {
          allowUnauthenticatedAccess: false,
        },
      });

      // Update the API logout to actually call the server logout endpoint
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          withCredentials: true, // Ensure cookies are sent
        },
      );

      // Clear local storage
      secureStorage.clear();

      // Final state update after cleanup
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: false,
        },
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      console.error("Logout error:", error);
    }
  };

  // Change password function
  const changePassword = async (password: string) => {
    try {
      // Set loading state
      setState((prev) => ({ ...prev, isLoading: true }));

      // Call change password API with withCredentials to include cookies
      await axios.post(
        `${API_BASE_URL}/auth/password/change`,
        { password },
        {
          withCredentials: true,
        },
      );

      // Update loading state
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Simplified sync function for keeping auth state in sync with server
  const syncAuthState = async (): Promise<boolean> => {
    if (!isMounted.current) return false;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Get current auth state from server
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true,
        validateStatus: (status) => status >= 200 && status < 500,
      });

      if (!isMounted.current) return false;

      if (response.status === 200 && response.data?.user) {
        // Update local storage with user data
        const authData: StoredAuthData = {
          user: response.data.user,
          session: response.data.session || {},
        };

        secureStorage.storeAuthData<StoredAuthData>(authData);

        // Update state with server data
        setState({
          user: authData.user,
          session: authData.session,
          isAuthenticated: true,
          isLoading: false,
          navigationState: {
            allowUnauthenticatedAccess: false,
          },
        });

        return true;
      } else {
        // If authentication failed, clear state
        secureStorage.clear();
        setState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          navigationState: {
            allowUnauthenticatedAccess: false,
          },
        });

        return false;
      }
    } catch (error) {
      if (!isMounted.current) return false;

      // Set loading to false but don't clear state on network errors
      setState((prev) => ({ ...prev, isLoading: false }));

      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        changePassword,
        syncAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Auth hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
