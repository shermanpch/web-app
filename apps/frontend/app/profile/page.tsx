"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { userApi } from "@/lib/api/endpoints/user";
import { UserQuotaResponse } from "@/types/user";
import { format } from "date-fns";

// Types for our component state
interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<UserQuotaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch current user data
        const userData = await authApi.getCurrentUser();
        if (userData) {
          setUser(userData);
        }

        // Fetch user quota
        const quotaData = await userApi.getUserQuota();
        setQuota(quotaData);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(
          "Failed to load some profile data. Please refresh to try again.",
        );
      }
    }

    fetchUserData();
  }, []);

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
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 font-serif text-center">
          My Profile
        </h1>

        {error && (
          <div className="text-red-400 bg-red-900/20 py-2 px-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Account Info Section */}
        <div className="bg-[#EDE6D6] rounded-2xl p-8 mb-8 shadow-lg w-full">
          <h2 className="text-2xl font-serif text-gray-800 mb-6">
            Account Info
          </h2>

          <div className="space-y-2 text-gray-800">
            <p>
              <span className="font-medium">Email:</span> {user?.email || "-"}
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
        <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full">
          <h2 className="text-2xl font-serif text-gray-800 mb-6">
            Subscription and Credits
          </h2>

          <div className="space-y-2 text-gray-800">
            <p>You&apos;re currently on the {getPlanDisplay()} plan</p>
            <p>Auto-renews 10 premium readings every month</p>
            <p>Next Renewal: {getNextRenewalDate()}</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
