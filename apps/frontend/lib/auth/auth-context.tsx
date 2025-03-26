"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/endpoints/auth';
import { secureStorage } from './secure-storage';
import { 
  User, 
  Session, 
  ExtendedAuthState,
  LoginCredentials
} from '@/types/auth';

// Auth context type that extends the auth state with methods
interface AuthContextType extends ExtendedAuthState {
  signUp: (_credentials: LoginCredentials) => Promise<void>;
  signIn: (_credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (_password: string) => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage type for secure storage
interface StoredAuthData {
  user: User;
  session: Session;
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<ExtendedAuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    navigationState: {
      allowUnauthenticatedAccess: false
    }
  });

  // Initialize auth state from storage
  useEffect(() => {
    const storedData = secureStorage.getAuthData<StoredAuthData>();
    
    if (storedData) {
      setState({
        user: storedData.user,
        session: storedData.session,
        isAuthenticated: true,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: false
        }
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Sign up function using LoginCredentials type
  const signUp = async (credentials: LoginCredentials) => {
    try {
      // Set loading state
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Call signup API
      const response = await authApi.signup(credentials);
      
      // Store session data securely
      const authData: StoredAuthData = {
        user: response.data.user as User,
        session: response.data.session,
      };
      
      secureStorage.storeAuthData<StoredAuthData>(authData);
      
      // Set navigationState to allow redirect without being authenticated
      setState(prev => ({ 
        ...prev,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: true
        }
      }));
      
      // Redirect to login page after successful signup
      router.push('/login');
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Sign in function using LoginCredentials type
  const signIn = async (credentials: LoginCredentials) => {
    try {
      // Set loading state
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Call login API
      const response = await authApi.login(credentials);
      
      // Store session data securely
      const authData: StoredAuthData = {
        user: response.data.user as User,
        session: response.data.session,
      };
      
      secureStorage.storeAuthData<StoredAuthData>(authData);
      
      // Update state
      setState({
        user: authData.user,
        session: authData.session,
        isAuthenticated: true,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: false
        }
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
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
          allowUnauthenticatedAccess: false
        }
      });
      
      // Perform cleanup operations asynchronously
      await Promise.all([
        authApi.logout(),
        secureStorage.clear()
      ]);
      
      // Final state update after cleanup
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: false
        }
      });
      
      // Redirect to login page after signout
      router.push('/login');
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Change password function
  const changePassword = async (password: string) => {
    try {
      // Set loading state
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Check if we have a session
      if (!state.session) {
        throw new Error('No active session. Please login again to change your password.');
      }
      
      // Call change password API
      await authApi.changePassword(
        password,
        state.session.access_token
      );
      
      // Update loading state
      setState(prev => ({ ...prev, isLoading: false }));
      
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        changePassword,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
