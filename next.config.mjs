/** @type {import('next').NextConfig} */
const nextConfig = {
  // Replit-specific configuration
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['*'] : [],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization'
          }
        ]
      }
    ]
  },
  // Disable strict mode for development
  reactStrictMode: false,
  // Ensure proper hostname binding
  devIndicators: {
    buildActivity: false
  }
}

export default nextConfig