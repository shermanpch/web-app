'use client';

import * as React from 'react';
import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Avoid hydration mismatch by only mounting the provider after initial render on client
  const [mounted, setMounted] = React.useState(false);
  
  // Handle smooth transitions and mounting
  React.useEffect(() => {
    // Get the initially applied theme before next-themes takes over
    const initialTheme = localStorage.getItem('theme') || 'system';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = initialTheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : initialTheme;
    
    // Add appropriate class based on resolved theme
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Handle theme transitions for all elements
    const rootStyles = window.getComputedStyle(document.documentElement);
    const existingTransition = rootStyles.getPropertyValue('transition');
    
    // Add transition to root element for smooth theme changes
    document.documentElement.style.transition = `${existingTransition}, background-color 0.2s, color 0.2s, border-color 0.2s`;
    
    // Then set mounted state to allow theme provider to take over
    setMounted(true);
    
    return () => {
      // Clean up transitions
      document.documentElement.style.transition = existingTransition;
    };
  }, []);
  
  // Use a theme-specific container to prevent flash during hydration
  if (!mounted) {
    return (
      <div>
        {children}
      </div>
    );
  }
  
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem={true} {...props}>
      {children}
    </NextThemeProvider>
  );
} 