'use client';

import React, { memo } from 'react';
import { Container } from '@ui/container';

interface TestimonialProps {
  id: string; 
  content: string; 
  author: string; 
  role: string; 
  source: string;
  url?: string;
}

const TestimonialCard = memo(({ 
  content, 
  author, 
  role, 
  source,
  url = '#'
}: Omit<TestimonialProps, 'id'>) => {
  return (
    <div className="h-64 backdrop-blur-lg rounded-xl border border-[hsl(var(--border))] transition-all duration-300 hover:translate-y-[-5px] hover:border-[hsl(var(--border))/80] overflow-hidden flex flex-col bg-[hsl(var(--card))] hover:bg-[hsl(var(--card))/90]">
      <div className="p-4 flex-grow flex flex-col">
        <p className="text-[hsl(var(--card-foreground))] mb-4 line-clamp-5">{content}</p>
        <div className="mt-auto pt-4">
          <p className="font-medium text-[hsl(var(--foreground))]">{author}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{role}</p>
        </div>
      </div>
      <div className="border-t border-[hsl(var(--border))] p-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">via {source}</p>
          <a 
            href={url} 
            aria-label={`View full testimonial from ${author}`}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors focus:outline-none focus:text-[hsl(var(--primary))]"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
});

TestimonialCard.displayName = 'TestimonialCard';

const Testimonials = () => {
  const testimonials: TestimonialProps[] = [
    {
      id: '1',
      content: "This template has completely transformed how we build web applications. The component library is thoughtfully designed and adapts perfectly to our needs.",
      author: "Alex Johnson",
      role: "CTO, TechSolutions",
      source: "Twitter",
      url: "https://twitter.com"
    },
    {
      id: '2',
      content: "I've tried many UI frameworks, but this one strikes the perfect balance between flexibility and structure. Saved us weeks of development time.",
      author: "Sarah Miller",
      role: "Lead Developer, CreativeApps",
      source: "LinkedIn",
      url: "https://linkedin.com"
    },
    {
      id: '3',
      content: "The accessibility features are exceptional. We were able to build a fully compliant application without having to retrofit anything.",
      author: "Michael Chen",
      role: "Engineering Lead, AccessibleTech",
      source: "GitHub",
      url: "https://github.com"
    },
    {
      id: '4',
      content: "As someone who builds tools for developers, I can't recommend this template enough. The dark mode implementation alone is worth it.",
      author: "Emily Rodriguez",
      role: "Founder, DevTools Pro",
      source: "Product Hunt",
      url: "https://producthunt.com"
    },
    {
      id: '5',
      content: "Our junior devs are getting up to speed much faster thanks to this template. The code organization and patterns are top-notch.",
      author: "David Wilson",
      role: "Engineering Manager, StartupX",
      source: "Twitter",
      url: "https://twitter.com"
    },
    {
      id: '6',
      content: "Been using this for 3 months now and it has significantly improved our development process. Worth every penny for the time saved.",
      author: "Lisa Park",
      role: "Lead Developer, SoftSolutions",
      source: "Review"
    },
  ];

  return (
    <section id="testimonials" className="py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">What Users Are Saying</h2>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            Join hundreds of satisfied developers who have elevated their projects with our template.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              content={testimonial.content}
              author={testimonial.author}
              role={testimonial.role}
              source={testimonial.source}
              url={testimonial.url}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Testimonials; 