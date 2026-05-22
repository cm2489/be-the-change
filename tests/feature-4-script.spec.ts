import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Feature 4 happy-path spec — cache-hit only.
//
// Pre-seeds a script_generations row for (testUser, testBill, 'support')
// so the POST /api/scripts call hits the cache and never reaches the
// real Anthropic API. This directly exercises the hard cost rule from
// CLAUDE.md: every script generation must be served from the cache when
// the (user_id, bill_id, stance) row already exists.
//
// The cache-miss path (real LLM generation) stays manual until a future
// PR adds an Anthropic mock to tests/mocks/external-apis.mjs; that
// follow-up is the reason lib/anthropic.ts already plumbs through
// ANTHROPIC_BASE_URL.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const TEST_EMAIL = `e2e-script-${suffix}@example.test`
const TEST_PASSWORD = 'E2eTestPassword!23'

const TEST_FULL_IDENTIFIER = `hr-e2e-script-${suffix}-119`
const TEST_BILL_TITLE = `E2E Bill ${suffix}: Script Flow Coverage`
const TEST_BILL_SUMMARY = `End-to-end test summary ${suffix}: backs the Feature 4 cache-hit spec.`
// Distinctive marker so the assertion can't be satisfied by other page
// text. Includes a year/identifier substring that's unlikely to appear
// elsewhere in the bill detail UI.
const SEEDED_SCRIPT_TEXT = `CACHED-SCRIPT-${suffix} — Hello, my name is the test constituent and I am calling about this bill. Please vote in favor. Thank you.`

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
let testUserId: string | null = null
let testBillId: string | null = null
let testScriptId: string | null = null

test.beforeAll(async () => {
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (userErr) throw userErr
  testUserId = userData.user.id

  const { data: billData, error: billErr } = await admin
    .from('bills')
    .insert({
      congress_number: 119,
      bill_type: 'hr',
      bill_number: 9996,
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
    .select('id')
    .single()
  if (billErr) throw billErr
  testBillId = billData.id

  // Seed the cache row. Values for tokens/cost are minimal but valid —
  // the column constraints are NOT NULL, not non-zero. The unique key
  // is (user_id, bill_id, stance).
  const { data: scriptRow, error: scriptErr } = await admin
    .from('script_generations')
    .insert({
      user_id: testUserId,
      bill_id: testBillId,
      stance: 'support',
      script_text: SEEDED_SCRIPT_TEXT,
      prompt_hash: 'e2e-seed-hash',
      model: 'claude-haiku-4-5',
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
    })
    .select('id')
    .single()
  if (scriptErr) throw scriptErr
  testScriptId = scriptRow.id
})

test.afterAll(async () => {
  if (testScriptId) {
    await admin.from('script_generations').delete().eq('id', testScriptId)
  }
  if (testBillId) {
    await admin.from('bills').delete().eq('id', testBillId)
  }
  if (testUserId) {
    await admin.auth.admin.deleteUser(testUserId)
  }
})

test('user generates, reviews, and saves a script via the cache path', async ({ page }) => {
  // Sign in.
  await page.goto('/login')
  await page.fill('input[type=email]', TEST_EMAIL)
  await page.fill('input[type=password]', TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)

  // Visit the seeded bill detail page.
  await page.goto(`/bills/${testBillId}`)
  await expect(page.getByRole('heading', { name: TEST_BILL_TITLE })).toBeVisible()

  // ScriptFlow card is rendered with the stance picker.
  await expect(page.getByRole('heading', { name: 'Call script' })).toBeVisible()

  const supportButton = page.getByRole('button', { name: 'Support', exact: true })
  const getScriptButton = page.getByRole('button', { name: 'Get my script', exact: true })

  // Get my script is disabled until a stance is picked.
  await expect(getScriptButton).toBeDisabled()
  await supportButton.click()
  await expect(getScriptButton).toBeEnabled()

  // Click Get my script — the route hits the cache and returns the seeded text.
  await getScriptButton.click()

  // Textarea appears with the seeded script_text — proves the cache path served it,
  // which means Anthropic was not called (the hard cost rule from CLAUDE.md).
  const textarea = page.getByLabel('Script')
  await expect(textarea).toBeVisible()
  await expect(textarea).toHaveValue(new RegExp(`CACHED-SCRIPT-${suffix}`))

  // Disclaimer is visible above the textarea.
  await expect(page.getByText('AI-drafted. Review and edit before use.')).toBeVisible()

  // Save & Review confirms review. The call surface (CallFlow) is a
  // separate component that the bill page reveals after save — its own
  // behavior is covered by tests/feature-5-call.spec.ts.
  const saveButton = page.getByRole('button', { name: 'Save & Review', exact: true })
  await expect(saveButton).toBeVisible()
  await saveButton.click()

  // Save button reflects the saved state.
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
})
