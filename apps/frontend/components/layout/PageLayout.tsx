"use client";

import React from "react";
import Image from "next/image";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 w-full h-full"
        style={{
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

      {/* Content container - just render the children, 
          don't create another full min-h-screen container 
          that would overlap with the navigation bar */}
      <div className="relative z-10 w-full flex-grow flex flex-col items-center justify-center px-4 overflow-auto">
        {children}
      </div>
    </>
  );
}
