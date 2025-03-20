import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@theme/theme-provider';
import Header from '@layout/header';
import Footer from '@layout/footer';
import { config } from '@config/index';

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
      <body className="min-h-screen w-full overflow-x-hidden bg-white dark:bg-slate-900 transition-colors duration-500">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
} 