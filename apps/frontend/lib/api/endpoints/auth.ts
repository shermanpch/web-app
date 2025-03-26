import axios from 'axios';
import { 
  LoginCredentials, 
  SignUpCredentials, 
  UserSessionResponse 
} from '@/types/auth';

// Define an error response structure
interface ErrorResponse {
  status: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      // Handle axios errors
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;
        
        // Create a more specific error with the backend message
        const errorMessage = errorData.detail || 
          (errorData.errors ? Object.values(errorData.errors).flat().join(', ') : 
          'Failed to create account');
          
        throw new Error(errorMessage);
      }
      
      // Generic error
      console.error('Signup error:', error);
      throw new Error('Failed to create account. Please try again later.');
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
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      // Handle axios errors
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;
        
        // Create a more specific error with the backend message
        const errorMessage = errorData.detail || 
          (errorData.errors ? Object.values(errorData.errors).flat().join(', ') : 
          'Authentication failed');
          
        throw new Error(errorMessage);
      }
      
      // Generic error
      console.error('Login error:', error);
      throw new Error('Failed to authenticate. Please try again later.');
    }
  },
  
  /**
   * Logout current user - client-side only implementation
   * This method doesn't communicate with a backend endpoint
   */
  async logout(): Promise<void> {
    // This is a client-side only logout implementation
    // No API call is made since there's no backend logout endpoint
    return Promise.resolve();
  },
  
  /**
   * Change user password 
   */
  async changePassword(password: string, accessToken: string, refreshToken: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/password/change`,
        { password, access_token: accessToken, refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      // Handle axios errors
      if (error?.response?.data) {
        // Extract backend error message
        const errorData = error.response.data as ErrorResponse;
        
        // Create a more specific error with the backend message
        const errorMessage = errorData.detail || 
          (errorData.errors ? Object.values(errorData.errors).flat().join(', ') : 
          'Password change failed');
          
        throw new Error(errorMessage);
      }
      
      // Generic error
      console.error('Password change error:', error);
      throw new Error('Failed to change password. Please try again later.');
    }
  },
};
