'use client';

import * as React from 'react';
import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Avoid hydration mismatch by only mounting the provider after initial render on client
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} {...props}>
      {children}
    </NextThemeProvider>
  );
} 