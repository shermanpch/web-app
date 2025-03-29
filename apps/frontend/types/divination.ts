/**
 * Divination types for I Ching readings and clarifications
 */

/**
 * Request for getting an I Ching reading
 */
export interface DivinationRequest {
  first_number: number;
  second_number: number;
  third_number: number;
  question: string;
  language: string;
  access_token: string;
  refresh_token: string;
}

/**
 * Line change information in an I Ching reading
 */
export interface LineChange {
  line: string;
  interpretation: string;
}

/**
 * Result hexagram information in an I Ching reading
 */
export interface HexagramResult {
  name: string;
  interpretation: string;
}

/**
 * Complete I Ching prediction with all details
 */
export interface IChingPrediction {
  hexagram_name: string;
  summary: string;
  interpretation: string;
  line_change: LineChange;
  result: HexagramResult;
  advice: string;
  image_path?: string;
}

/**
 * I Ching reading response from the API
 */
export interface DivinationResponse {
  hexagram_name: string;
  summary: string;
  interpretation: string;
  line_change: LineChange;
  result: HexagramResult;
  advice: string;
  image_path?: string;
  first_number: number;
  second_number: number;
  third_number: number;
  question: string;
  language: string;
}

/**
 * Request to save an I Ching reading
 */
export interface SaveReadingRequest {
  user_id: string;
  question: string;
  first_number: number;
  second_number: number;
  third_number: number;
  language: string;
  prediction: IChingPrediction;
  clarifying_question?: string;
  clarifying_answer?: string;
  access_token: string;
  refresh_token: string;
}

/**
 * Response after saving an I Ching reading
 */
export interface SaveReadingResponse {
  id: string;
  user_id: string;
  created_at: string;
  success: boolean;
  message: string;
}

/**
 * Request to update an I Ching reading with a clarifying question
 */
export interface UpdateReadingRequest {
  id: string;
  user_id: string;
  question: string;
  first_number: number;
  second_number: number;
  third_number: number;
  language: string;
  prediction: IChingPrediction;
  clarifying_question: string;
  clarifying_answer?: string;
  access_token: string;
  refresh_token: string;
}

/**
 * Response after updating an I Ching reading with a clarifying question
 */
export interface UpdateReadingResponse {
  id: string;
  user_id: string;
  question: string;
  first_number: number;
  second_number: number;
  third_number: number;
  language: string;
  prediction: IChingPrediction;
  clarifying_question: string;
  clarifying_answer: string;
}
