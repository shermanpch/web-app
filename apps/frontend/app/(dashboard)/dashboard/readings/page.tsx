import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Panel } from "@ui/panel";
import { UserReadingHistoryEntry } from "@/types/divination";
import ReadingsTable from "./_components/readings-table";

// Define the internal API URL for server-side fetching
const INTERNAL_API_URL = process.env.INTERNAL_BACKEND_API_URL;
if (!INTERNAL_API_URL) {
  console.error("FATAL ERROR: INTERNAL_BACKEND_API_URL is not defined.");
  // Optionally throw an error during build or handle appropriately
}

// Function to fetch readings server-side
async function fetchUserReadings(
  authToken: string | undefined,
): Promise<UserReadingHistoryEntry[]> {
  if (!authToken || !INTERNAL_API_URL) {
    console.warn("[fetchUserReadings] Auth token or Internal API URL missing.");
    return [];
  }
  console.log(`[fetchUserReadings] Fetching from: ${INTERNAL_API_URL}/api/user/readings`);
  try {
    const response = await fetch(`${INTERNAL_API_URL}/api/user/readings`, {
      headers: {
        // Pass the auth token from the cookie via Authorization header
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache reading history on the server
    });

    console.log(`[fetchUserReadings] API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[fetchUserReadings] API responded with status ${response.status}. Body: ${errorBody}`,
      );
      // Handle specific errors, e.g., 401 Unauthorized
      if (response.status === 401) {
        redirect("/login?error=invalid_session&from=readings_fetch");
      }
      // For other errors, return empty array
      return [];
    }

    const data = await response.json();
    console.log(`[fetchUserReadings] Successfully fetched ${data.length} readings.`);
    return data as UserReadingHistoryEntry[];

  } catch (error) {
    console.error("[fetchUserReadings] Error fetching readings:", error);
    // Return empty array on fetch errors
    return [];
  }
}

export default async function ReadingsHistoryPage() {
  // Fetch auth token server-side
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  // Basic auth check (Middleware/Layout should handle primary check, but good practice)
  if (!authToken) {
    console.log("[ReadingsHistoryPage] No auth token found, redirecting.");
    redirect("/login?redirectedFrom=/dashboard/readings");
  }

  // Fetch readings data server-side
  console.log("[ReadingsHistoryPage] Fetching user readings...");
  const readings = await fetchUserReadings(authToken);
  console.log(`[ReadingsHistoryPage] Render with ${readings.length} readings.`);

  return (
    <div className="flex flex-col p-8">
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-8">
        Reading History
      </h1>
      <Panel className="max-w-full overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Your Past Readings</h2>
        {readings.length > 0 ? (
          <ReadingsTable readings={readings} />
        ) : (
          <p className="text-[hsl(var(--muted-foreground))]">
            You have no saved readings yet. Perform a divination to see it
            here.
          </p>
        )}
      </Panel>
    </div>
  );
} 