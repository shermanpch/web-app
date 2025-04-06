import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchServerSideUser } from "@/lib/server/authUtils";
import { UserQuotaResponse } from "@/types/user";
import { QuotaDisplay } from "./QuotaDisplay";

// Define the internal API URL for server-side fetching
const INTERNAL_API_URL = process.env.INTERNAL_BACKEND_API_URL;
if (!INTERNAL_API_URL) {
  console.error("FATAL ERROR: INTERNAL_BACKEND_API_URL is not defined.");
}

// Function to fetch quota server-side
async function fetchUserQuota(
  authToken: string | undefined,
): Promise<UserQuotaResponse | null> {
  if (!authToken || !INTERNAL_API_URL) {
    console.warn("[fetchUserQuota] Auth token or Internal API URL missing.");
    return null;
  }

  try {
    const response = await fetch(`${INTERNAL_API_URL}/api/user/quota`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store", // Don't cache quota information
    });

    if (!response.ok) {
      console.error(
        `[fetchUserQuota] API responded with status ${response.status}`,
      );
      // Handle specific errors, e.g., 401 Unauthorized
      if (response.status === 401) {
        redirect("/login?error=invalid_session&from=quota_fetch");
      }
      return null;
    }

    const data = await response.json();
    return data as UserQuotaResponse;
  } catch (error) {
    console.error("[fetchUserQuota] Error fetching quota:", error);
    return null;
  }
}

export default async function QuotaPage() {
  // Fetch auth token server-side
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    redirect("/login?redirectedFrom=/dashboard/quota");
  }

  // Fetch user data
  const user = await fetchServerSideUser(authToken);
  if (!user) {
    redirect("/login?error=invalid_session");
  }

  // Fetch quota data
  const quotaData = await fetchUserQuota(authToken);

  return <QuotaDisplay initialQuotaData={quotaData} userEmail={user.email} />;
} 