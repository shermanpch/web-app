export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expires_at?: number;
  [key: string]: any;
}

export interface UserSessionData {
  user: User;
  session: Session;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserSessionResponse {
  status: string;
  data: UserSessionData;
  message?: string;
}

export interface ErrorResponse {
  status: string;
  detail?: string;
  errors?: Record<string, string[]>;
  message?: string;
  error_description?: string;
}
