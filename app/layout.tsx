import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Self-hosted via next/font (was a render-blocking Google Fonts @import in
// globals.css — caused FOUT/layout shift). Same three faces and weights as
// before; each exposes a CSS variable that globals.css and tailwind.config.ts
// fontFamily now reference.
const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const interTight = Inter_Tight({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  weight: '500',
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

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
  // ink (#1F2E2A) — was a leftover generic blue (#1d4ed8) that matched no token.
  themeColor: '#1F2E2A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
