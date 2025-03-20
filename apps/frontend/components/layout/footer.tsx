'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@ui/container';
import { config } from '@config/index';

// Common SVG icons extracted to reduce repetition
const SocialIcon = ({ children, href, label }: { children: React.ReactNode, href: string, label: string }) => (
  <a 
    href={href} 
    aria-label={label} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
  >
    {children}
  </a>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-xl font-bold text-slate-900 dark:text-white">Company</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4 transition-colors duration-300">
              A modern, responsive template to kickstart your next web application project.
            </p>
            <div className="flex space-x-4">
              <SocialIcon href={config.social.github} label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </SocialIcon>
              <SocialIcon href={config.social.twitter} label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </SocialIcon>
              <SocialIcon href={config.social.linkedin} label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M23.5 6.2c-.3-1.1-1.1-1.9-2.1-2.2C19.5 3.4 12 3.4 12 3.4s-7.5 0-9.5.6c-1 .3-1.8 1.1-2.1 2.2C0 8.2 0 12 0 12s0 3.8.5 5.8c.3 1.1 1.1 1.9 2.1 2.2 2 .6 9.5.6 9.5.6s7.5 0 9.5-.6c1-.3 1.8-1.1 2.1-2.2.5-2 .5-5.8.5-5.8s0-3.8-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z"/>
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="col-span-1">
            <h3 className="text-slate-900 dark:text-white font-medium mb-4 transition-colors duration-300">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Features</Link></li>
              <li><Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Pricing</Link></li>
              <li><Link href="/docs" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Documentation</Link></li>
              <li><Link href="/api" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">API Reference</Link></li>
              <li><Link href="/integrations" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Integrations</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-slate-900 dark:text-white font-medium mb-4 transition-colors duration-300">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">About</Link></li>
              <li><Link href="/blog" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Blog</Link></li>
              <li><Link href="/careers" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Careers</Link></li>
              <li><Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Contact</Link></li>
              <li><Link href="/media" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Media</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-slate-900 dark:text-white font-medium mb-4 transition-colors duration-300">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Terms of Service</Link></li>
              <li><Link href="/data-processing" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Data Processing</Link></li>
              <li><Link href="/cookies" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-500 dark:focus:text-blue-400">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <p className="text-slate-500 dark:text-slate-500 text-center">
            &copy; {currentYear} {config.siteName}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer; 