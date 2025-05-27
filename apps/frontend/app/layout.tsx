import React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import NavigationBar from "@/components/layout/NavigationBar";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "deltao.ai",
  description: "deltao.ai: Your Personal Deltao AI Divination Assistant",
  icons: {
    icon: [
      { url: "/assets/favicon/favicon.ico", sizes: "any" },
      { url: "/assets/favicon/favicon.svg", type: "image/svg+xml" },
      {
        url: "/assets/favicon/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    apple: {
      url: "/assets/favicon/apple-touch-icon.png",
      type: "image/png",
    },
    other: [
      {
        rel: "manifest",
        url: "/assets/favicon/site.webmanifest",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              <NavigationBar user={null} />
            </div>
            <main className="flex-grow flex flex-col">{children}</main>
            <Toaster richColors position="top-center" duration={2000} />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
