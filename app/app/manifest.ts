// /app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Be The Change - Democracy Starts With You',
    short_name: 'BeTheChange',
    description: 'Empower your voice in democracy with AI-powered advocacy scripts',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    categories: ['politics', 'social', 'utilities'],

    shortcuts: [
      {
        name: 'Generate Script',
        url: '/scripts/new',
        description: 'Create a new advocacy script',
        icons: [{ src: '/icons/script-96.png', sizes: '96x96' }]
      },
      {
        name: 'Find Representatives',
        url: '/representatives',
        description: 'Find your elected officials',
        icons: [{ src: '/icons/rep-96.png', sizes: '96x96' }]
      }
    ],

    icons: [
      { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],

    screenshots: [
      {
        src: '/screenshots/mobile-dashboard.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Dashboard view'
      },
      {
        src: '/screenshots/desktop-dashboard.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop experience'
      }
    ]
  }
}