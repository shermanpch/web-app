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
      <div className="fixed inset-0 z-0 w-full h-full">
        <Image
          src="/assets/background.png?v=2"
          alt="Background"
          fill
          priority
          quality={100}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 w-full flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <div className="w-full max-w-7xl mx-auto">{children}</div>
      </div>
    </>
  );
}
