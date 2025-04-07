import React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import NavigationBar from "@/components/layout/NavigationBar";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web App",
  description: "A web application",
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
      </head>
      <body className="font-serif bg-gray-900">
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <div className="relative z-20">
              <NavigationBar user={null} />
            </div>
            <main className="flex-grow flex flex-col">{children}</main>
            <Toaster richColors position="top-center" />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
