'use client';

import React, { useState, memo } from 'react';
import { Container } from '@ui/container';

interface ExamplePromptProps {
  text: string;
  onClick: () => void;
}

const ExamplePrompt = memo(({ text, onClick }: ExamplePromptProps) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors rounded-full bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))/20] border border-[hsl(var(--border))/30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))/30]"
  >
    {text}
  </button>
));

ExamplePrompt.displayName = 'ExamplePrompt';

const Hero = () => {
  const [searchText, setSearchText] = useState('');

  const examplePrompts = [
    "How to Integrate Stripe in Next.js",
    "Guide to React Hooks",
    "Tailwind CSS Responsive Design"
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handlePromptClick = (prompt: string) => {
    setSearchText(prompt);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchText);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 gradient-text">
            Your Technical Documentation Assistant
          </h1>
          <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] mb-12 max-w-3xl mx-auto">
            Access comprehensive technical documentation, code examples, and best practices all in one place. Let AI help you find exactly what you need.
          </p>

          {/* Search Demo */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--gradient-start))/20] via-[hsl(var(--gradient-middle))/20] to-[hsl(var(--gradient-end))/20] rounded-xl blur-[25px]"></div>
              <div className="relative bg-[hsl(var(--background))/60] backdrop-blur-md rounded-xl shadow-lg p-2">
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <label htmlFor="search-input" className="sr-only">Search query</label>
                  <input
                    id="search-input"
                    type="text"
                    value={searchText}
                    onChange={handleSearchChange}
                    className="w-full bg-[hsl(var(--foreground))/5] rounded-xl px-4 py-3 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))/50] placeholder-[hsl(var(--foreground))/60] border-none backdrop-blur-sm ring-1 ring-[hsl(var(--gradient-middle))/30] transition-all duration-200 hover:ring-[hsl(var(--gradient-middle))/50] gradient-glow"
                    placeholder="Select a prompt below to view an example of output documentation..."
                  />
                  <button 
                    type="submit" 
                    aria-label="Search" 
                    className="ml-2 p-3 rounded-xl text-white bg-gradient-to-r from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-middle))] to-[hsl(var(--gradient-end))] hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="text-center mb-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">SELECT A PROMPT</p>
            <div className="flex flex-wrap justify-center gap-3">
              {examplePrompts.map((prompt, index) => (
                <ExamplePrompt 
                  key={index}
                  text={prompt}
                  onClick={() => handlePromptClick(prompt)}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* Background Gradient Effect */}
      <div aria-hidden="true" className="absolute inset-0 bg-[hsl(var(--background))] -z-10"></div>
      <div aria-hidden="true" className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-100 -z-10"></div>
    </section>
  );
};

export default Hero; 