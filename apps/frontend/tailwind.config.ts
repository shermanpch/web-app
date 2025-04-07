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
        "brand-input-bg": "#D8CDBA",
        "brand-button-bg": "#5A7D60",
        "brand-button-hover": "#4A6D50",
        "brand-input-text": "#6b7280",
      },
    },
  },
  plugins: [],
};

export default config;
