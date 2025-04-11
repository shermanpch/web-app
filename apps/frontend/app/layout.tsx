import React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import NavigationBar from "@/components/layout/NavigationBar";
import QueryProvider from "@/components/providers/QueryProvider";
import { serverAuthApi } from "@/lib/api/endpoints/auth.server";
import "./globals.css";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "deltao.ai",
  description: "deltao.ai: Your Personal Deltao AI Divination Assistant",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user data server-side
  const user = await serverAuthApi.getCurrentUser();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Preload background image */}
        <link
          rel="preload"
          href="/assets/background.png?v=2"
          as="image"
          type="image/png"
        />
      </head>
      <body className="font-serif bg-black">
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <div className="relative z-20">
              <NavigationBar user={user} />
            </div>
            <main className="flex-grow flex flex-col">{children}</main>
            <Toaster richColors position="top-center" duration={2000} />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
