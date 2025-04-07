import React from "react";
import NavigationBar from "./NavigationBar";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-gray-900 flex flex-col"
      style={{ backgroundImage: "url('/assets/background.png')" }}
    >
      <NavigationBar />
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        {children}
      </main>
    </div>
  );
}
