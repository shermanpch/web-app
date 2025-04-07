/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // This configures the Next.js development server proxy.
  // It does NOT affect production builds (Netlify handles that).
  async rewrites() {
    const INTERNAL_API_URL = process.env.INTERNAL_BACKEND_API_URL;

    return [
      {
        source: "/api/:path*",
        destination: `${INTERNAL_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
