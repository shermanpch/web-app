"use client";

import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import { authApi } from "@/lib/api/endpoints/auth";
import { userApi } from "@/lib/api/endpoints/user";
import { UserQuotaResponse } from "@/types/user";
import { format } from "date-fns";

export default function ProfilePage() {
  // Fetch current user data using React Query
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.getCurrentUser,
  });

  // Fetch user quota using React Query
  const {
    data: quota,
    isLoading: isLoadingQuota,
    error: quotaError,
  } = useQuery<UserQuotaResponse | null>({
    queryKey: ["userQuota"],
    queryFn: userApi.getUserQuota,
  });

  // Combine loading states
  const isLoading = isLoadingUser || isLoadingQuota;

  // Combine potential errors
  const error = userError || quotaError;

  // Format the membership date
  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (err) {
      return "-";
    }
  };

  // Format the renewal date - For now, simulate this with a date 30 days from created_at
  const getNextRenewalDate = () => {
    if (!quota?.created_at) return "-";

    try {
      // For now, we're hardcoding that renewals happen monthly from the creation date
      const creationDate = new Date(quota.created_at);
      const renewalDate = new Date(creationDate);
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      return format(renewalDate, "MMMM d, yyyy");
    } catch (err) {
      return "-";
    }
  };

  // Function to get plan name nicely formatted
  const getPlanDisplay = () => {
    if (!quota) return "Free";
    return (
      quota.membership_type.charAt(0).toUpperCase() +
      quota.membership_type.slice(1)
    );
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
            <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full text-gray-800 mt-8">
              <h2 className="text-2xl font-serif text-gray-800 mb-6">
                Account Info
              </h2>

              <div className="space-y-2 text-gray-800">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {user?.email || "-"}
                </p>
                <p>
                  <span className="font-medium">Plan:</span> {getPlanDisplay()}
                </p>
                <p>
                  <span className="font-medium">Premium Readings left:</span>{" "}
                  {quota?.remaining_queries !== undefined
                    ? quota.remaining_queries
                    : "-"}
                </p>
                <p>
                  <span className="font-medium">Member Since:</span>{" "}
                  {formatMemberSince(user?.created_at || quota?.created_at)}
                </p>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full text-gray-800 mt-8">
              <h2 className="text-2xl font-serif text-gray-800 mb-6">
                Subscription and Credits
              </h2>

              <div className="space-y-2 text-gray-800">
                <p>You&apos;re currently on the {getPlanDisplay()} plan</p>
                <p>Auto-renews 10 premium readings every month</p>
                <p>Next Renewal: {getNextRenewalDate()}</p>
              </div>
            </div>
          </>
        )}
      </ContentContainer>
    </PageLayout>
  );
}
