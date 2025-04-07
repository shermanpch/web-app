import React from "react";

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  center?: boolean;
  noMargin?: boolean;
}

export default function Heading({ 
  children, 
  className = "",
  center = true,
  noMargin = false
}: HeadingProps) {
  return (
    <h1 
      className={`text-4xl md:text-5xl font-bold text-gray-200 ${noMargin ? '' : 'mb-8'} font-serif text-shadow-sm ${center ? 'text-center' : ''} ${className}`}
    >
      {children}
    </h1>
  );
} 