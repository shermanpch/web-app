import React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
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
      <body className="font-serif">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
