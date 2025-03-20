import React from 'react';
import { Container } from '@ui/container';

export const metadata = {
  title: 'About Us | Technical Documentation Assistant',
  description: 'Learn more about our team and mission to provide comprehensive technical documentation.',
};

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <Container>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500">
          About Us
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Placeholder for the About page content.
        </p>
      </Container>
    </div>
  );
} 