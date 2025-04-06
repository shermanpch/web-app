"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePageState } from "@/hooks/use-page-state";
import { userApi } from "@/lib/api/endpoints/user";
import { UserQuotaResponse } from "@/types/user";

interface QuotaDisplayProps {
  initialQuotaData: UserQuotaResponse | null;
  userEmail: string | undefined;
}

export function QuotaDisplay({ initialQuotaData, userEmail }: QuotaDisplayProps) {
  // State management
  const [displayedQuota, setDisplayedQuota] = useState(initialQuotaData);
  const {
    isLoading: isUpgrading,
    error: upgradeError,
    withLoadingState: withUpgradeLoadingState,
    setError: setUpgradeError,
  } = usePageState();
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Handle upgrade to premium
  const handleUpgrade = async () => {
    // Clear any previous states
    setUpgradeError(null);
    setUpgradeSuccess(false);

    await withUpgradeLoadingState(async () => {
      const updatedQuota = await userApi.upgradeToPremium();
      setDisplayedQuota(updatedQuota);
      setUpgradeSuccess(true);
    }, "Failed to upgrade membership.");
  };

  return (
    <div className="flex flex-col p-8">
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-8">
        Membership Status
      </h1>
      <Panel className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Email
            </h2>
            <p className="text-lg text-[hsl(var(--foreground))]">{userEmail}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Membership Type
            </h2>
            <p className="text-lg text-[hsl(var(--foreground))]">
              {displayedQuota?.membership_type ?? "N/A"}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Queries Left
            </h2>
            <p className="text-lg text-[hsl(var(--foreground))]">
              {displayedQuota?.remaining_queries ?? "N/A"}
            </p>
          </div>
          
          {/* Show upgrade button only for non-premium users */}
          {displayedQuota?.membership_type !== "premium" && (
            <div className="pt-4">
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full sm:w-auto"
              >
                {isUpgrading ? "Upgrading..." : "Upgrade to Premium"}
              </Button>
            </div>
          )}

          {/* Success message */}
          {upgradeSuccess && (
            <Alert className="mt-4">
              <AlertDescription>
                Successfully upgraded to Premium membership! You now have {displayedQuota?.remaining_queries} queries available.
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {upgradeError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{upgradeError}</AlertDescription>
            </Alert>
          )}

          {/* Premium status message */}
          {displayedQuota?.membership_type === "premium" && (
            <Alert className="mt-4">
              <AlertDescription>
                You are currently on the Premium plan.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Panel>
    </div>
  );
} 