/** @type {import('next').NextConfig} */
const nextConfig = {
  // Replit-specific configuration for server deployment
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  },
  // Disable strict mode for development
  reactStrictMode: false
}

export default nextConfig