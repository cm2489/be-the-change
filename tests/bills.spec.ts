import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Happy-path E2E: a logged-in user lands on /bills, sees a seeded bill at the
// top of the default feed, clicks through to the detail page, and confirms the
// bill's title, summary, and bill_number render correctly.
//
// Supabase auth + data are real (no API-level mocks). beforeAll creates a
// throwaway user and seeds one bill with a high urgency_score so it tops the
// default-feed sort regardless of other rows in the dev DB. afterAll deletes
// both. The bill has a unique full_identifier so repeated/parallel runs don't
// collide on bills_full_identifier_key.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const TEST_EMAIL = `e2e-bills-${suffix}@example.test`
const TEST_PASSWORD = 'E2eTestPassword!23'

// bill_number 9999 is outside the real-world range (Congress.gov chamber
// numbers run in the low thousands), but the meaningful uniqueness lives in
// full_identifier — that's the column with the unique constraint.
const TEST_BILL_NUMBER = 9999
const TEST_FULL_IDENTIFIER = `hr-e2e-${suffix}-119`
const TEST_BILL_TITLE = `E2E Bill ${suffix}: Modernize Civic Engagement`
const TEST_BILL_SUMMARY = `End-to-end test summary ${suffix}: ensures the bill detail page renders summary_text correctly post-canonical-schema.`

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
let testUserId: string | null = null
let testBillId: string | null = null

test.beforeAll(async () => {
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (userErr) throw userErr
  testUserId = userData.user.id

  // urgency_score 0.99 pins the seeded bill at the top of get_default_feed's
  // (urgency_score DESC, last_action_date DESC NULLS LAST) sort. Max naturally
  // computed value is 1.0 (floor_vote + recency bonus), so other rows can
  // tie but won't outrank ours within the visible page-size window.
  const { data: billData, error: billErr } = await admin
    .from('bills')
    .insert({
      congress_number: 119,
      bill_type: 'hr',
      bill_number: TEST_BILL_NUMBER,
      full_identifier: TEST_FULL_IDENTIFIER,
      title: TEST_BILL_TITLE,
      summary_text: TEST_BILL_SUMMARY,
      sponsor_bioguide_id: 'TEST_E2E_SPONSOR',
      introduced_date: '2026-05-01',
      last_action_date: '2026-05-20',
      last_action_text: 'Referred to Committee on End-to-End Testing',
      status: 'committee',
      congress_gov_url: `https://example.test/bill/${TEST_FULL_IDENTIFIER}`,
      urgency_score: 0.99,
    })
    .select()
    .single()
  if (billErr) throw billErr
  testBillId = billData.id
})

test.afterAll(async () => {
  if (testBillId) {
    await admin.from('bills').delete().eq('id', testBillId)
  }
  if (testUserId) {
    await admin.auth.admin.deleteUser(testUserId)
  }
})

test('user navigates from bill feed to bill detail', async ({ page }) => {
  // Sign in
  await page.goto('/login')
  await page.fill('input[type=email]', TEST_EMAIL)
  await page.fill('input[type=password]', TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)

  // Visit the bill feed
  await page.goto('/bills')
  await expect(page.getByRole('heading', { name: 'Issues' })).toBeVisible()

  // Seeded bill renders in the feed. Asserting on title only — bill_number
  // is not in the feed RPC return shape so the card's identifier slot is
  // empty (see docs/deferred.md#feature-3-bill-number-missing-from-feed-rpcs).
  const seededCard = page.getByText(TEST_BILL_TITLE)
  await expect(seededCard).toBeVisible()

  // V4 feed card (variant="v4"): the "Decoded" container renders. This seeded
  // bill has summary_text but no ai_headline, so it shows the degrade state
  // (summary promoted as the lead) under the "Decoded" label, plus the
  // "Take action" CTA. (The filled headline state needs the feed-RPC migration.)
  await expect(page.getByText('Decoded').first()).toBeVisible()
  await expect(page.getByText(TEST_BILL_SUMMARY).first()).toBeVisible()
  await expect(page.getByText('Take action').first()).toBeVisible()

  // Click navigates to the detail page (BillCard wraps the card in a Link).
  await seededCard.click()
  await page.waitForURL(new RegExp(`/bills/${testBillId}`))

  // Detail page renders title, summary, and bill_number. The detail page
  // queries via .select('*') so bill_number is available here even though
  // it's missing from the feed RPCs.
  await expect(page.getByRole('heading', { name: TEST_BILL_TITLE })).toBeVisible()
  await expect(page.getByText(TEST_BILL_SUMMARY)).toBeVisible()
  await expect(page.getByText(String(TEST_BILL_NUMBER))).toBeVisible()
})
