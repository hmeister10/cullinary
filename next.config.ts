import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['source.unsplash.com'],
    unoptimized: true, // This helps with static exports
  },
  // Make sure static assets are properly handled
  output: 'standalone',
};

export default nextConfig;
