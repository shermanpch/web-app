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
    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 border border-slate-300/50 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {text}
  </button>
));

ExamplePrompt.displayName = 'ExamplePrompt';

const Hero = () => {
  const [searchText, setSearchText] = useState('');

  const examplePrompts = [
    "How to implement authentication in Express.js?",
    "Best practices for React performance optimization",
    "Building a REST API with Node.js and MongoDB"
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
    <section className="relative min-h-screen flex items-center justify-center py-20 mt-16 overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-500">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-500 text-transparent bg-clip-text transition-colors duration-500">
            Your Technical Documentation Assistant
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto transition-colors duration-500">
            Access comprehensive technical documentation, code examples, and best practices all in one place. Let AI help you find exactly what you need.
          </p>

          {/* Search Demo */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-blue-400/10 to-purple-500/10 rounded-xl blur-xl"></div>
              <div className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-2 transition-colors duration-500">
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <label htmlFor="search-input" className="sr-only">Search query</label>
                  <input
                    id="search-input"
                    type="text"
                    value={searchText}
                    onChange={handleSearchChange}
                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500 transition-colors duration-500"
                    placeholder="Ask any technical question..."
                  />
                  <button 
                    type="submit" 
                    aria-label="Search" 
                    className="ml-2 p-3 rounded-lg transition-all duration-300 text-white bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <p className="text-sm text-slate-500 uppercase tracking-wider mb-4 transition-colors duration-500">TRY THESE EXAMPLES</p>
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
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 -z-10 transition-colors duration-500"></div>
      <div aria-hidden="true" className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-100 -z-10 transition-opacity duration-500"></div>
    </section>
  );
};

export default Hero; 