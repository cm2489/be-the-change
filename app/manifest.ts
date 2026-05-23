import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oravan',
    short_name: 'Oravan',
    description: 'Make your voice heard. One call at a time.',
    start_url: '/dashboard',
    display: 'standalone',
    // Design tokens (was generic slate `#f8fafc` + leftover blue `#1d4ed8`,
    // neither in the palette). Matches the layout.tsx themeColor fix from Batch 1.
    background_color: '#F7F4EE', // paper
    theme_color: '#1F2E2A', // ink
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
