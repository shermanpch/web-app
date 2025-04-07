"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import NavigationBar from "./NavigationBar";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  // Lock the body scroll position to prevent shifts
  useEffect(() => {
    // Save the original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Force a consistent viewport width by preventing body scrolling
    document.body.style.overflow = "hidden";

    return () => {
      // Restore original overflow when component unmounts
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-auto">
      {/* Background image with fixed positioning */}
      <div
        className="fixed inset-0 z-0 w-full h-full"
        style={{
          // Apply absolute positioning with transform to center the background
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        <Image
          src="/assets/background.png"
          alt="Background"
          fill
          priority
          quality={100}
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>

      {/* Content container with relative positioning */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <NavigationBar />
        <main className="flex-grow flex flex-col items-center justify-center px-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
