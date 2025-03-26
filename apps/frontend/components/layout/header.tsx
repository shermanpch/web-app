'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@ui/container';
import { ThemeToggle } from '@theme/theme-toggle';
import { navLinks } from '@config/index';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 py-2 sm:py-4 bg-[hsl(var(--background))]">
      <header className={`
        max-w-7xl mx-auto bg-[hsl(var(--background)/90)] backdrop-blur-lg 
        border border-[hsl(var(--border)/20)] rounded-xl sm:rounded-2xl 
        shadow-lg transition-all duration-300
        ${scrolled ? 'py-2' : 'py-3'}
      `}>
        <Container>
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="group cursor-pointer transition-transform duration-300 hover:scale-105 flex items-center">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3">
                  <Image
                    src="/assets/logo.svg"
                    alt="Company Logo"
                    width={40}
                    height={40}
                    className="w-full h-full text-blue-500"
                    priority
                  />
                </div>
                <span className="text-lg sm:text-xl font-bold text-[hsl(var(--foreground))]">Company</span>
              </Link>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center space-x-6 mx-auto">
                {navLinks.map((link, index) => (
                  <Link 
                    key={index}
                    href={link.href} 
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-[hsl(var(--foreground)/80)] hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              type="button"
              className="md:hidden text-[hsl(var(--foreground)/80)] hover:bg-[hsl(var(--muted))] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-[hsl(var(--foreground)/80)] hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                Sign In
              </Link>
              <Link href="/signup" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-white bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                Get Started
              </Link>
            </div>
          </div>
        </Container>
      </header>
    </div>
  );
};

export default Header; 