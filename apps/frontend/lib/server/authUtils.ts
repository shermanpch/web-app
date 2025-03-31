import { User } from "@/types/auth";

// This function runs ONLY on the server
export async function fetchServerSideUser(
  authToken: string | undefined,
): Promise<User | null> {
  if (!authToken) {
    return null;
  }

  const INTERNAL_API_URL = process.env.INTERNAL_BACKEND_API_URL

  try {
    // Use native fetch
    const response = await fetch(`${INTERNAL_API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[fetchServerSideUser] API responded with status ${response.status}`,
      );
      return null;
    }

    const userData: User = await response.json();
    return userData;
  } catch (error) {
    console.error("[fetchServerSideUser] Error fetching user:", error);
    return null;
  }
}
