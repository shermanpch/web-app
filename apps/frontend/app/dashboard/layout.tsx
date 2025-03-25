"use client";

import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add CSS to hide any existing headers but preserve theme
  React.useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    // Add CSS to hide header and footer only
    style.innerHTML = `
      header, footer, div[class*="fixed top-0"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    // Append to head
    document.head.appendChild(style);
    
    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Use a className that inherits the theme styles from the main layout
  // but positions our content at the top level
  return (
    <div className="min-h-screen w-full absolute top-0 left-0 z-[100]">
      {children}
    </div>
  );
} 