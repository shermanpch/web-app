import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchServerSideUser } from '@/lib/server/authUtils';
import { Panel } from "@/components/ui/panel";
import { DivinationForm } from "@/components/divination/divination-form";
import { User } from '@/types/auth';

// Make the page component async
export default async function DivinationPage() {
  // Fetch user server-side, simpler version since layout already handles auth
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
  const user: User | null = await fetchServerSideUser(authToken);
  
  if (!user) {
    // Handle case where user couldn't be fetched (e.g., token invalid)
    redirect('/login?error=invalid_session');
  }

  // User is fetched and valid
  return (
    <div className="flex flex-col p-8">
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-8">
        I Ching Divination
      </h1>
      <Panel className="max-w-full relative z-[150]">
        <h2 className="text-xl font-semibold mb-4">
          I Ching Reading & Clarification
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">
          Receive your I Ching reading and ask follow-up questions for deeper
          insights.
        </p>
        {/* Pass the user ID as a prop */}
        <DivinationForm userId={user.id} />
      </Panel>
    </div>
  );
}
