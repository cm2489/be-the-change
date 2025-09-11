/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow all hosts for Replit iframe compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ]
  },
  // Configure allowed origins for development
  experimental: {
    allowedOrigins: ['*']
  }
}

module.exports = nextConfig