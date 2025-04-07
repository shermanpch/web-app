import React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import NavigationBar from "@/components/layout/NavigationBar";
import { cookies } from "next/headers";
import { User } from "@/types/auth";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

// Add this line to prevent caching
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Web App",
  description: "A web application",
};

async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    return null;
  }

  const INTERNAL_API_URL = process.env.INTERNAL_BACKEND_API_URL;
  if (!INTERNAL_API_URL) {
    console.error("[getUser] INTERNAL_BACKEND_API_URL is not set.");
    return null;
  }

  try {
    const response = await fetch(`${INTERNAL_API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[getUser] API responded with status ${response.status}`);
      return null;
    }

    const userData: User = await response.json();
    return userData;
  } catch (error) {
    console.error("[getUser] Error fetching user:", error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-serif bg-gray-900">
        <div className="min-h-screen flex flex-col">
          <div className="relative z-20">
            <NavigationBar user={user} />
          </div>
          <main className="flex-grow flex flex-col">
            <QueryProvider>{children}</QueryProvider>
          </main>
          <Toaster richColors position="top-center" />
        </div>
      </body>
    </html>
  );
}
