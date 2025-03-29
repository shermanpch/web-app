export const config = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Web App Template",
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "A modern web application template",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@example.com",
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com",
    github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://linkedin.com",
  },
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID || "",
};

export const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
];
