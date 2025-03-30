/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // This configures the Next.js development server proxy.
  // It does NOT affect production builds (Netlify handles that).
  async rewrites() {
    // Ensure this function returns an array of rewrite objects.
    return [
      {
        // source: The incoming path pattern requested from the browser/frontend.
        // It matches any path starting with '/api/'.
        // ':path*' captures the rest of the path after '/api/'.
        source: "/api/:path*",

        // destination: The target URL where the request should be forwarded.
        // Replace 'http://localhost:8000' if your local backend runs on a different port.
        // It forwards to the backend, maintaining the '/api/' prefix and the captured path.
        destination: "http://localhost:8000/api/:path*",
      },
      // You can add more rewrite rules here if necessary for other paths.
    ];
  },
};

module.exports = nextConfig;
