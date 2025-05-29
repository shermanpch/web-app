"use client";

import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import { userApi } from "@/lib/api/endpoints/user";
import { FrontendUserProfileStatusResponse } from "@/types/user";
import { format, differenceInDays } from "date-fns";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  // State for tooltip visibility
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Check if this profile load follows an upgrade
  const [shouldRefetch, setShouldRefetch] = useState(false);

  useEffect(() => {
    // Check if we're coming from an upgrade
    const justUpgraded = sessionStorage.getItem("justUpgraded") === "true";

    if (justUpgraded) {
      // Clear the flag
      sessionStorage.removeItem("justUpgraded");
      // Set state to trigger refetch
      setShouldRefetch(true);
    }
  }, []);

  // Fetch combined profile and quota status using React Query
  const { data, isLoading, error, refetch } =
    useQuery<FrontendUserProfileStatusResponse>({
      queryKey: ["userProfileStatus"],
      queryFn: userApi.getUserProfileStatus,
      staleTime: 1000 * 60 * 5, // 5 minutes - prevent frequent refetches
      refetchOnMount: false, // Don't refetch automatically on mount
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });

  // Trigger a refetch if needed
  useEffect(() => {
    if (shouldRefetch) {
      refetch();
      setShouldRefetch(false);
    }
  }, [shouldRefetch, refetch]);

  // Format dates helper function
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return "-";
    }
  };

  // Format feature name helper function
  const formatFeatureName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get premium expiration display
  const getPremiumExpiration = () => {
    if (!data?.profile) return "-";
    if (data.profile.membership_tier_name === "free") return "-";
    return formatDate(data.profile.premium_expiration || undefined);
  };

  // Calculate progress percentage for quota
  const calculateProgressPercentage = (used: number, limit: number | null) => {
    if (limit === null) return 0; // No limit means no progress to show
    if (limit === 0) return 100; // Prevent division by zero
    return Math.min(Math.round((used / limit) * 100), 100); // Cap at 100%
  };

  // Get progress bar color based on usage
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-amber-500"; // Warning color when near limit
    return "bg-green-500"; // Default color for normal usage
  };

  // Calculate days until reset
  const getDaysUntilReset = (resetDate?: string) => {
    if (!resetDate) return "-";
    try {
      const today = new Date();
      const reset = new Date(resetDate);
      const daysLeft = differenceInDays(reset, today);

      if (daysLeft < 0) return "0"; // Already passed
      return daysLeft.toString();
    } catch {
      return "-";
    }
  };

  return (
    <PageLayout>
      <ContentContainer className="max-w-5xl">
        <Heading>My Profile</Heading>

        {error && (
          <div className="text-red-400 bg-red-900/20 py-2 px-4 rounded-lg text-center mt-6">
            {(error as Error).message || "Error loading profile data"}
          </div>
        )}

        {isLoading ? (
          <div className="text-gray-200 text-center mt-6">
            Loading profile data...
          </div>
        ) : (
          <>
            {/* Account Info Section */}
            <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full text-gray-900 mt-8">
              <h2 className="text-2xl font-serif text-gray-900 mb-6">
                Account Info
              </h2>

              <div className="space-y-2 text-gray-900">
                <p>
                  <span className="font-medium">User ID:</span>{" "}
                  {data?.profile.id || "-"}
                </p>
                <p>
                  <span className="font-medium">Membership Tier:</span>{" "}
                  {data?.profile
                    ? formatFeatureName(data.profile.membership_tier_name)
                    : "Free"}
                </p>
                <p>
                  <span className="font-medium">Premium Expiration:</span>{" "}
                  {getPremiumExpiration()}
                </p>
                <p>
                  <span className="font-medium">Member Since:</span>{" "}
                  {formatDate(data?.profile.created_at)}
                </p>
              </div>
            </div>

            {/* Usage Section */}
            <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full text-gray-900 mt-8">
              <h2 className="text-2xl font-serif text-gray-900 mb-6">Usage</h2>

              <div className="space-y-6">
                {data?.quotas.map((quota) => {
                  const percentage = calculateProgressPercentage(
                    quota.used,
                    quota.limit,
                  );
                  const progressColor = getProgressBarColor(percentage);
                  const daysToReset = getDaysUntilReset(quota.resets_at);
                  const featureName = formatFeatureName(quota.feature_name);
                  const isPremiumDivination = quota.feature_name
                    .toLowerCase()
                    .includes("premium_divination");
                  // Convert feature_id to string for consistent type with showTooltip state
                  const featureIdStr = String(quota.feature_id);

                  return (
                    <div
                      key={quota.feature_id}
                      className="space-y-4 text-gray-900 border-b border-gray-300 pb-6 last:border-0"
                    >
                      <div className="relative">
                        <h3 className="text-lg font-medium inline-flex items-center">
                          {featureName}

                          {isPremiumDivination && (
                            <span
                              className="ml-2 cursor-help text-gray-700"
                              onMouseEnter={() => setShowTooltip(featureIdStr)}
                              onMouseLeave={() => setShowTooltip(null)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </h3>

                        {showTooltip === featureIdStr &&
                          isPremiumDivination && (
                            <div className="absolute z-10 bg-gray-900 text-white text-sm p-3 rounded shadow-lg max-w-xs mt-1">
                              Premium Divination allows you to access Deep Dive readings for more detailed and personalized interpretations.
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                          <p>
                            <span className="font-medium">Usage: </span>
                            {quota.used} /{" "}
                            {quota.limit === null ? "∞" : quota.limit}
                          </p>
                        </div>

                        {/* Progress bar */}
                        <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                          {quota.limit !== null && (
                            <div
                              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          )}
                        </div>

                        <div className="flex justify-end mt-1 text-sm">
                          <p>
                            <span className="font-medium">Resets in: </span>
                            {daysToReset}{" "}
                            {parseInt(daysToReset) === 1 ? "day" : "days"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </ContentContainer>
    </PageLayout>
  );
}
