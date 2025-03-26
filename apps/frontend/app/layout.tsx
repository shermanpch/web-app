import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@theme/theme-provider';
import Header from '@layout/header';
import { config } from '@config/index';
import { AuthProvider } from '@/lib/auth/auth-context';
import Script from 'next/script';

// Load font only once for performance optimization
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap', // Ensure text is visible during font loading
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    template: `%s | ${config.siteName}`,
    default: config.siteName,
  },
  description: config.siteDescription,
  keywords: ['documentation', 'technical', 'developer', 'code', 'examples', 'nextjs', 'react', 'javascript'],
  authors: [{ name: 'Your Company', url: 'https://yourcompany.com' }],
  creator: 'Your Company',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: config.siteName,
    title: config.siteName,
    description: config.siteDescription,
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: config.siteName
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.siteName,
    description: config.siteDescription,
    images: ['/og-image.jpg'],
    creator: '@yourcompany',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
  },
};

// Inline critical CSS to prevent theme flashing
const criticalCSS = `
  /* Prevent flash of wrong theme */
  html { opacity: 0; }
  html.light, html:not(.dark) {
    --background-color: #ffffff;
    --text-color: #0f172a;
    --input-bg: #ffffff;
    --input-text: #0f172a;
    --input-border: #e2e8f0;
  }
  html.dark, html.theme-dark {
    --background-color: #0f172a;
    --text-color: #f8fafc;
    --input-bg: #1e293b;
    --input-text: #f8fafc;
    --input-border: #1e293b;
  }
  @media (prefers-color-scheme: dark) {
    html:not(.light) {
      --background-color: #0f172a;
      --text-color: #f8fafc;
      --input-bg: #1e293b;
      --input-text: #f8fafc;
      --input-border: #1e293b;
    }
  }
  @media (prefers-color-scheme: light) {
    html:not(.dark) {
      --background-color: #ffffff;
      --text-color: #0f172a;
      --input-bg: #ffffff;
      --input-text: #0f172a;
      --input-border: #e2e8f0;
    }
  }
  html, body { 
    background-color: var(--background-color);
    color: var(--text-color);
  }
  input, textarea, select {
    background-color: var(--input-bg);
    color: var(--input-text);
    border-color: var(--input-border);
  }
  /* Remove initial opacity once everything is ready */
  html.theme-ready { 
    opacity: 1;
    transition: opacity 0.1s ease-out;
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={inter.variable}
    >
      <head>
        {/* Inline critical CSS to prevent theme flash */}
        <style
          dangerouslySetInnerHTML={{ __html: criticalCSS }}
        />
        
        {/* Theme detection script - runs before any rendering */}
        <Script id="theme-detector" strategy="beforeInteractive">
          {`
            (function() {
              try {
                // Match system preference with stored preference
                const storedTheme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                // Determine which theme to use initially
                let initialTheme;
                
                // If no stored theme or system theme, respect OS preference
                if (!storedTheme || storedTheme === 'system') {
                  initialTheme = systemPrefersDark ? 'dark' : 'light';
                } else {
                  // Use stored explicit preference
                  initialTheme = storedTheme;
                }
                
                // Apply theme immediately to prevent flash
                if (initialTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }

                // Set up live system preference change detection
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                  if (localStorage.getItem('theme') === 'system') {
                    if (e.matches) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.classList.remove('light');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.classList.add('light');
                    }
                  }
                });
                
                // Make the page visible once theme is applied
                document.documentElement.classList.add('theme-ready');
              } catch (e) {
                // If error occurs, make page visible anyway
                document.documentElement.classList.add('theme-ready');
                // Handle errors gracefully - prefer system setting if localStorage fails
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                  document.documentElement.classList.add('dark');
                }
              }
            })();
          `}
        </Script>
      </head>
      <body className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans min-h-screen w-full overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 