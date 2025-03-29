"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, memo } from "react";

function ThemeToggleButton() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Only show UI after hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle toggle for keyboard users
  const handleToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    // SSR placeholder with same dimensions to avoid layout shift
    return (
      <button
        className="w-10 h-10 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center"
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className="sr-only">Loading theme toggle</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={handleToggle}
      className="w-10 h-10 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted-foreground/20))] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      )}
    </button>
  );
}

// Memoize to prevent unnecessary re-renders
export const ThemeToggle = memo(ThemeToggleButton);
