import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Happy-path E2E: a logged-in user enters a valid address on /representatives
// and sees their House rep + 2 Senators rendered with name, party, and phone.
//
// External APIs (Google Civic Divisions, Congress.gov) are mocked via
// tests/mocks/external-apis.mjs — see playwright.config.ts. Supabase auth
// is real: we create a throwaway user via the admin API in beforeAll and
// cascade-delete them in afterAll.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const TEST_EMAIL = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`
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

test('user enters address and sees three federal reps', async ({ page }) => {
  // Log in
  await page.goto('/login')
  await page.fill('input[type=email]', TEST_EMAIL)
  await page.fill('input[type=password]', TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)

  // Open /representatives directly. The page handles its own address
  // entry — we don't need to walk through onboarding for this test.
  await page.goto('/representatives')
  await expect(page.getByRole('heading', { name: 'My Representatives' })).toBeVisible()

  // Fill the Empire State Building address (NY-12, mocked in fixtures).
  const addressInput = page.locator('input[placeholder*="Springfield"]')
  await addressInput.fill('350 Fifth Avenue, New York, NY 10118')
  await page.getByRole('button', { name: /Find my reps|Update address/ }).click()

  // All three reps should render with name + tel: link to their phone.
  await expect(page.getByText('Charlie Repman')).toBeVisible()
  await expect(page.getByText('Alicia Tester')).toBeVisible()
  await expect(page.getByText('Brent Junior')).toBeVisible()

  await expect(page.locator('a[href="tel:202-225-0003"]')).toBeVisible()
  await expect(page.locator('a[href="tel:202-224-0001"]')).toBeVisible()
  await expect(page.locator('a[href="tel:202-224-0002"]')).toBeVisible()

  // Title text on the cards proves chamber + state are wired through.
  await expect(page.getByText('U.S. Representative, NY-12')).toBeVisible()
  await expect(page.getByText('U.S. Senator, NY')).toHaveCount(2)
})
