import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local before defineConfig — the test runner needs Supabase
// credentials (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) to
// create + delete throwaway test users via the admin API. Tiny inline
// loader to avoid a dotenv dep.
try {
  const envFile = readFileSync(resolve(__dirname, '.env.local'), 'utf8')
  for (const rawLine of envFile.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m) continue
    const key = m[1]
    if (process.env[key] !== undefined) continue
    const value = m[2].replace(/^["']|["']$/g, '')
    process.env[key] = value
  }
} catch {
  // No .env.local — CI must pass env vars directly.
}

const MOCK_PORT = 4444
const NEXT_PORT = 3000

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,

  use: {
    baseURL: `http://localhost:${NEXT_PORT}`,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Two webServers: the external-API mock starts first, and the Next.js
  // dev server is pointed at it via env vars so server-side fetches in
  // syncRepsForUser hit the mock instead of the real Google + Congress.gov.
  webServer: [
    {
      command: `node tests/mocks/external-apis.mjs`,
      url: `http://localhost:${MOCK_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      env: { MOCK_API_PORT: String(MOCK_PORT) },
    },
    {
      command: 'npm run dev',
      url: `http://localhost:${NEXT_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        CONGRESS_API_BASE_URL: `http://localhost:${MOCK_PORT}/v3`,
        GOOGLE_CIVIC_API_BASE_URL: `http://localhost:${MOCK_PORT}/civicinfo/v2`,
        // The libs require these to be set, but the mock ignores their
        // values. Use clearly-fake placeholders so a leak in the mock
        // setup can't accidentally hit the real APIs.
        CONGRESS_API_KEY: 'test-mock-congress-key',
        GOOGLE_CIVIC_API_KEY: 'test-mock-google-key',
      },
    },
  ],
})
