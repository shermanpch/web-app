import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchServerSideUser } from "@/lib/server/authUtils";
import { Panel } from "@/components/ui/panel";

export default async function DashboardPage() {
  // Server-side authentication and data fetching
  const authToken = cookies().get("auth_token")?.value;
  
  if (!authToken) {
    redirect("/login");
  }
  
  const user = await fetchServerSideUser(authToken);
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Dashboard
        </h1>
      </div>

      <Panel className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--foreground))]">
          Welcome, {user?.email || "User"}!
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          You have successfully logged in to the application.
        </p>
        {user && (
          <div className="p-4 bg-[hsl(var(--muted))] rounded-md">
            <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              User details:
            </p>
            <pre className="text-xs text-[hsl(var(--foreground))] bg-[hsl(var(--muted)/70)] p-3 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </Panel>
    </div>
  );
}
