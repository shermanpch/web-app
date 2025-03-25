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
      console.error('Sign-up failed', error);
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
      console.error('Sign-in failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Set navigation state to allow unauthenticated redirect
      setState(prev => ({ 
        ...prev, 
        isLoading: true,
        navigationState: {
          allowUnauthenticatedAccess: true
        }
      }));
      
      // Client-side logout
      await authApi.logout();
      
      // Clear stored data
      secureStorage.clear();
      
      // Reset state but keep navigation state
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        navigationState: {
          allowUnauthenticatedAccess: true
        }
      });
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Sign-out failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
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
