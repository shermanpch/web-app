import { User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

// This function runs ONLY on the server
export async function fetchServerSideUser(authToken: string | undefined): Promise<User | null> {
  if (!authToken) {
    return null;
  }

  try {
    // Use native fetch or a server-safe library
    const response = await fetch(`/api/auth/me`, {
      headers: {
        // Pass the token explicitly in the Authorization header
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
       console.error(`[fetchServerSideUser] API responded with status ${response.status}`);
       // Optionally try to refresh token here server-side if you have refresh logic
       return null; // Token likely invalid or expired
    }

    const userData: User = await response.json();
    return userData;

  } catch (error) {
    console.error('[fetchServerSideUser] Error fetching user:', error);
    return null;
  }
} 