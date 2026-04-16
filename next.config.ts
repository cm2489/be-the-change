import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.congress.gov' },
      { protocol: 'https', hostname: '*.gravatar.com' },
    ],
  },
}

export default nextConfig
