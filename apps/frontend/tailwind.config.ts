import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
      },
      colors: {
        // Primary Action Colors
        "brand-button-bg": "#4A6D50",      // Primary button background
        "brand-button-hover": "#3E5A44",   // Primary button hover state
        
        // Secondary Action/Accent Colors
        "brand-accent": "#B88A6A",         // Secondary action/accent color
        "brand-accent-hover": "#a87a5a",   // Secondary action/accent hover
        
        // Input Field Colors
        "brand-input-bg": "#D8CDBA",       // Input standard background
        "brand-input-text": "#505762",     // Input text color (darker for better contrast)
        
        // Other brand colors
        "brand-hexagram": "#B8860B",       // Hexagram color
      },
    },
  },
  plugins: [],
};

export default config;
