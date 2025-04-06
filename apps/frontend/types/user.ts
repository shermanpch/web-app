/**
 * User quota and reading related types.
 */

/**
 * Request to get user quota information.
 */
export interface UserQuotaRequest {
  user_id: string;
}

/**
 * Request to update (decrement) user quota.
 */
export interface UpdateUserQuotaRequest {
  user_id: string;
}

/**
 * Response containing user quota information.
 */
export interface UserQuotaResponse {
  user_id: string;
  membership_type: string;
  remaining_queries: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response containing updated user quota information.
 */
export interface UpdateUserQuotaResponse {
  user_id: string;
  membership_type: string;
  remaining_queries: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response containing a single user reading.
 */
export interface UserReadingResponse {
  id: string;
  user_id: string;
  question: string;
  first_number: number;
  second_number: number;
  third_number: number;
  language: string;
  prediction?: Record<string, any>;
  clarifying_question?: string;
  clarifying_answer?: string;
  created_at: string;
} 