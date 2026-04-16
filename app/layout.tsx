import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Be The Change — Make Your Voice Heard',
  description:
    'Hyper-personalized civic engagement. Track legislation you care about and call your representatives in one tap.',
  keywords: ['civic engagement', 'representatives', 'legislation', 'voting', 'democracy'],
  authors: [{ name: 'Be The Change' }],
  openGraph: {
    title: 'Be The Change',
    description: 'Make your voice heard. One call at a time.',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Be The Change',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
