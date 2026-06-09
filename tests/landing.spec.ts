import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Happy-path E2E for the public landing page (app/page.tsx).
//
// Two cases:
//  1. A logged-out visitor sees the marketing page: brand wordmark, hero
//     headline, the primary "Start making calls" CTA, the How-it-works and
//     What-Oravan-does sections, and the footer.
//  2. A logged-in visitor is redirected off "/" into the app — the LandingPage
//     server component reads the session and redirect()s away from the
//     anonymous marketing page.
//
// Case 2 uses real Supabase auth: beforeAll creates a throwaway user via the
// admin API and afterAll deletes them. No external-API mocks are needed — the
// landing makes no rep/bill fetches, only auth.getSession().

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const TEST_EMAIL = `e2e-landing-${suffix}@example.test`
const TEST_PASSWORD = 'E2eTestPassword!23'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
let testUserId: string | null = null

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw error
  testUserId = data.user.id
})

test.afterAll(async () => {
  if (testUserId) {
    await admin.auth.admin.deleteUser(testUserId)
  }
})

test('logged-out visitor sees the marketing landing', async ({ page }) => {
  await page.goto('/')

  // Brand wordmark (rendered as an aria-labelled SVG in nav + footer).
  await expect(page.getByRole('img', { name: 'Oravan' }).first()).toBeVisible()

  // Hero headline + primary CTA.
  await expect(page.getByRole('heading', { name: /Your voice matters/ })).toBeVisible()
  await expect(page.getByText('Start making calls').first()).toBeVisible()

  // The two explainer sections.
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What Oravan does' })).toBeVisible()

  // Footer legal link.
  await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible()
})

test('the call walkthrough renders on the landing and steps on dot click', async ({ page }) => {
  await page.goto('/')

  const walkthrough = page.getByRole('group', { name: /Walkthrough/ })
  await expect(walkthrough).toBeVisible()

  // Five labelled step dots (Decode → Logged).
  await expect(walkthrough.getByRole('tab')).toHaveCount(5)

  // Pause autoplay so the active step is deterministic, then jump to step 4.
  await page.getByRole('button', { name: 'Pause walkthrough' }).click()
  const callTab = walkthrough.getByRole('tab', { name: 'Go to step 4: Call' })
  await callTab.click()
  await expect(callTab).toHaveAttribute('aria-selected', 'true')
})

test('logged-in visitor is redirected off the landing into the app', async ({ page }) => {
  // Sign in (lands on dashboard or onboarding).
  await page.goto('/login')
  await page.fill('input[type=email]', TEST_EMAIL)
  await page.fill('input[type=password]', TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)

  // Visiting "/" with a live session must not show the anonymous marketing
  // page — the server component redirects into the app.
  await page.goto('/')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)
})
