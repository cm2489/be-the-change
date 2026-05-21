import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Phase 3b spec: verifies deriveDisplayStatus is wired into the feed surface.
// Two bills are seeded with status='committee'. One was "introduced" 3 days
// ago (inside the 7-day window — should display "introduced"); the other 30
// days ago (outside the window — should display "committee"). Both pin to
// the top of the default feed via urgency_score=0.99 so a logged-in user
// with no interests sees them on /bills.
//
// Mirrors the seed/teardown shape of bills.spec.ts: real Supabase auth +
// data via service role, throwaway user per run, unique full_identifiers
// so parallel/repeat runs can't collide on bills_full_identifier_key.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const TEST_EMAIL = `e2e-display-status-${suffix}@example.test`
const TEST_PASSWORD = 'E2eTestPassword!23'

// Two seeded bills. Titles + summaries deliberately avoid the words
// "introduced" and "committee" so the lowercase status-span assertions
// can't be satisfied by other card text.
const RECENT_FULL_IDENTIFIER = `hr-e2e-recent-${suffix}-119`
const RECENT_BILL_TITLE = `E2E Bill Recent ${suffix}: Modernize Federal Records`
const OLD_FULL_IDENTIFIER = `hr-e2e-old-${suffix}-119`
const OLD_BILL_TITLE = `E2E Bill Old ${suffix}: Update Federal Records`

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
let testUserId: string | null = null
const seededBillIds: string[] = []

test.beforeAll(async () => {
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (userErr) throw userErr
  testUserId = userData.user.id

  const { data: rows, error: billErr } = await admin
    .from('bills')
    .insert([
      {
        congress_number: 119,
        bill_type: 'hr',
        bill_number: 9998,
        full_identifier: RECENT_FULL_IDENTIFIER,
        title: RECENT_BILL_TITLE,
        summary_text: 'Recent-introduction bill for the display-status window spec.',
        sponsor_bioguide_id: 'TEST_E2E_SPONSOR',
        introduced_date: daysAgoISO(3),
        last_action_date: daysAgoISO(3),
        last_action_text: 'Referred to a federal panel for review',
        status: 'committee',
        congress_gov_url: `https://example.test/bill/${RECENT_FULL_IDENTIFIER}`,
        urgency_score: 0.99,
      },
      {
        congress_number: 119,
        bill_type: 'hr',
        bill_number: 9997,
        full_identifier: OLD_FULL_IDENTIFIER,
        title: OLD_BILL_TITLE,
        summary_text: 'Older bill past the 7-day display window for the spec.',
        sponsor_bioguide_id: 'TEST_E2E_SPONSOR',
        introduced_date: daysAgoISO(30),
        last_action_date: daysAgoISO(20),
        last_action_text: 'Referred to a federal panel for review',
        status: 'committee',
        congress_gov_url: `https://example.test/bill/${OLD_FULL_IDENTIFIER}`,
        urgency_score: 0.99,
      },
    ])
    .select('id')
  if (billErr) throw billErr
  for (const r of rows ?? []) seededBillIds.push(r.id)
})

test.afterAll(async () => {
  if (seededBillIds.length > 0) {
    await admin.from('bills').delete().in('id', seededBillIds)
  }
  if (testUserId) {
    await admin.auth.admin.deleteUser(testUserId)
  }
})

test('feed card shows time-based introduced→committee display status', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type=email]', TEST_EMAIL)
  await page.fill('input[type=password]', TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)

  await page.goto('/bills')
  await expect(page.getByRole('heading', { name: 'Issues' })).toBeVisible()

  // BillCard wraps each card in a Link, so locating by role=link + title
  // text scopes assertions to a single card.
  const recentCard = page.getByRole('link').filter({ hasText: RECENT_BILL_TITLE })
  const oldCard = page.getByRole('link').filter({ hasText: OLD_BILL_TITLE })

  await expect(recentCard).toBeVisible()
  await expect(oldCard).toBeVisible()

  // Status span text is lowercase ('introduced' / 'committee'); Tailwind's
  // `capitalize` class only changes rendered case, not DOM text content.
  // The urgency chip uses 'Introduced' (capital I) — case-sensitive
  // contains keeps the two unambiguous.
  await expect(recentCard).toContainText('introduced')
  await expect(oldCard).toContainText('committee')
})
