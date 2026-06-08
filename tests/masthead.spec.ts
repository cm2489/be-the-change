import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// App-shell happy path — the desktop left sidebar was replaced by a top
// masthead (feat/spine-ceiling). One throwaway user (admin-created, deleted in
// afterAll), same seed+cleanup pattern as feature-7-impact.spec.ts. Guards the
// removal: the <aside> rail is gone, the masthead carries the wordmark + the
// four section links, and the signal-underline active state (aria-current)
// tracks the route across a client navigation.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const PASSWORD = 'E2eTestPassword!23'
const EMAIL = `e2e-masthead-${suffix}@example.test`

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
let userId: string | null = null

test.beforeAll(async () => {
  const res = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  })
  if (res.error) throw res.error
  userId = res.data.user.id
})

test.afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId)
})

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('input[type=email]', EMAIL)
  await page.fill('input[type=password]', PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)
}

test('shell: top masthead replaces the sidebar; nav active-state tracks the route', async ({
  page,
}) => {
  await login(page)
  await page.goto('/dashboard')

  // The desktop left sidebar (an <aside>) is gone — the shell is a top masthead.
  await expect(page.locator('aside')).toHaveCount(0)

  const masthead = page.getByRole('banner') // the <header>
  await expect(masthead).toBeVisible()
  await expect(masthead.getByRole('link', { name: 'Oravan' })).toBeVisible()

  // All four section links live in the masthead.
  for (const label of ['Home', 'Issues', 'My Reps', 'Your Impact']) {
    await expect(masthead.getByRole('link', { name: label, exact: true })).toBeVisible()
  }

  // The active section is marked on the current route (drives the signal underline).
  await expect(
    masthead.getByRole('link', { name: 'Home', exact: true }),
  ).toHaveAttribute('aria-current', 'page')

  // Navigating updates the active marker.
  await masthead.getByRole('link', { name: 'Issues', exact: true }).click()
  await page.waitForURL('**/bills')
  await expect(
    masthead.getByRole('link', { name: 'Issues', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
})
