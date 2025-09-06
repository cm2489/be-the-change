import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration for Replit environment
  allowedDevOrigins: ["e5ad6364-5c2e-45c9-b125-a2805328b1ce-00-3hxgzhm23rs25.worf.replit.dev"],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
