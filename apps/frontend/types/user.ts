/**
 * User quota and reading related types.
 */

import { UserReadingHistoryEntry } from "./divination";

/**
 * Frontend user profile response from the backend.
 */
export interface FrontendUserProfileResponse {
  id: string;
  membership_tier_id: number;
  membership_tier_name: string;
  premium_expiration: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Frontend user quota status for a specific feature.
 */
export interface FrontendUserQuotaStatus {
  feature_id: number;
  feature_name: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  resets_at: string;
}

/**
 * Combined frontend response with profile and quota status.
 */
export interface FrontendUserProfileStatusResponse {
  profile: FrontendUserProfileResponse;
  quotas: FrontendUserQuotaStatus[];
}

/**
 * Paginated response for user readings.
 */
export interface PaginatedUserReadingsResponse {
  items: UserReadingHistoryEntry[];
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}
