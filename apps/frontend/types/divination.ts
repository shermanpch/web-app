/**
 * Divination types for I Ching readings and clarifications
 */

/**
 * Deep Dive context information provided by the user
 */
export interface DeepDiveContext {
  areaOfLife?: string;
  backgroundSituation?: string;
  currentFeelings?: string[];
  desiredOutcome?: string;
}

/**
 * Initial divination data collected from the try-now page
 */
export interface InitialDivinationData {
  question: string;
  mode: "basic" | "deep_dive";
  deepDiveContext?: DeepDiveContext;
}

/**
 * Request for getting an I Ching reading
 */
export interface DivinationRequest {
  first_number: number;
  second_number: number;
  third_number: number;
  question: string;
  mode: string;
  language: string;
  deep_dive_context?: {
    area_of_life?: string;
    background_situation?: string;
    current_feelings?: string[];
    desired_outcome?: string;
  };
}

/**
 * Line change information in an I Ching reading
 */
export interface LineChange {
  line: string;
  pinyin: string;
  interpretation: string;
}

/**
 * Result hexagram information in an I Ching reading
 */
export interface HexagramResult {
  name: string;
  pinyin: string;
  interpretation: string;
}

/**
 * Complete I Ching prediction with all details
 */
export interface IChingPrediction {
  hexagram_name: string;
  pinyin: string;
  summary: string;
  interpretation: string;
  line_change: LineChange;
  result: HexagramResult;
  advice: string;
  deep_dive_details?: IChingDeepDivePredictionDetails;
}

/**
 * Detailed information for a Deep Dive reading
 */
export interface IChingDeepDivePredictionDetails {
  expanded_primary_interpretation: string;
  contextual_changing_line_interpretation: string;
  expanded_transformed_interpretation: string;
  thematic_connections: string[];
  actionable_insights_and_reflections: string;
  potential_pitfalls?: string;
  key_strengths?: string;
}

/**
 * I Ching reading response from the API
 */
export interface DivinationResponse extends IChingPrediction {
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
  mode: string;
  language: string;
  first_number: number;
  second_number: number;
  third_number: number;
  prediction: IChingPrediction;
  clarifying_question?: string;
  clarifying_answer?: string;
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
  mode: string;
  language: string;
  first_number: number;
  second_number: number;
  third_number: number;
  prediction: IChingPrediction;
  clarifying_question: string;
  clarifying_answer?: string;
}

/**
 * Response after updating an I Ching reading with a clarifying question
 */
export interface UpdateReadingResponse {
  id: string;
  user_id: string;
  question: string;
  mode: string;
  language: string;
  first_number: number;
  second_number: number;
  third_number: number;
  prediction: IChingPrediction;
  clarifying_question: string;
  clarifying_answer: string;
}

/**
 * Represents a single historical reading entry fetched from the backend.
 * Matches the structure of backend's UserReadingResponse.
 */
export interface UserReadingHistoryEntry {
  id: string;
  user_id: string;
  question: string;
  mode: string;
  language: string;
  first_number: number;
  second_number: number;
  third_number: number;
  prediction: IChingPrediction | null;
  clarifying_question: string | null;
  clarifying_answer: string | null;
  created_at: string; // ISO date string
}
