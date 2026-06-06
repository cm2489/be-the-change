import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1F2E2A',
          hover: '#121C19',
          95: '#243530',
          85: '#374741',
          70: '#556159',
          50: '#828A83',
          20: '#CFD3CE',
          10: '#E6E8E4',
        },
        signal: {
          DEFAULT: '#E65A2B',
          hover: '#CB4918',
          50: '#F2B8A0',
          10: '#FBE6DC',
        },
        paper: {
          DEFAULT: '#F7F4EE',
          dark: '#EDE7D8',
          mid: '#FAF8F5', // V4 Decoded-container fill — faint, ~40% from paper toward card-white
        },
        card: '#FFFFFF',
        divider: {
          DEFAULT: '#E8E2D3',
          strong: '#D4CBB5',
        },
        graphite: {
          DEFAULT: '#1A1A1A',
          2: '#5A5A5A',
          3: '#8A8A8A',
          4: '#B8B3A8',
        },
        moss: {
          DEFAULT: '#2F6B4E',
          10: '#E1EDE7',
        },
        amber: {
          DEFAULT: '#C27803',
          10: '#FBECC8',
        },
        oxblood: {
          DEFAULT: '#9A2A2A',
          10: '#F5DDD8',
        },
      },
      fontFamily: {
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-inter-tight)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h1: ['36px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h2: ['24px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h3: ['18px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        body: ['16px', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        small: ['14px', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        meta: ['12px', { lineHeight: '1.35', letterSpacing: '0.08em' }],
        mono: ['13px', { lineHeight: '1.35', letterSpacing: '0' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(31,46,42,0.07)',
        md: '0 4px 16px rgba(31,46,42,0.09)',
        lg: '0 16px 48px rgba(31,46,42,0.14)',
        inset: 'inset 0 0 0 1px rgba(31,46,42,0.08)',
        focus: '0 0 0 2px #F7F4EE, 0 0 0 4px #1F2E2A',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
        exit: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
      },
      transitionDuration: {
        micro: '120ms',
        component: '200ms',
        page: '400ms',
      },
      maxWidth: {
        category: '9rem', // V4 interest pill — caps long category labels (paired with truncate)
      },
      maxHeight: {
        title: '2.75em', // V4 card title 2-line cap = 2 lines x leading-snug (1.375)
      },
    },
  },
  plugins: [],
}

export default config
