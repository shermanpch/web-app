// Export all user types
export * from "./user";

// Shared component interfaces
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Testimonial interfaces
export interface TestimonialProps {
  id: string;
  content: string;
  author: string;
  role: string;
  source: string;
}

// Feature interfaces
export interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Navigation interfaces
export interface NavLink {
  href: string;
  label: string;
}
