import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Feature 5 spec — script→call loop + the no-reps round-trip branch.
//
// Cache-hit only for scripts (a script_generations row is pre-seeded so
// POST /api/scripts never reaches Anthropic, same approach as the Feature 4
// spec). Two throwaway users share one seeded bill + one seeded rep:
//   - userWithReps  → linked via user_representatives; drives the full loop
//                     (save script → tap to call → confirm → call_events row).
//   - userNoReps    → no user_representatives, no address; drives the
//                     "Add my address" empty-state + return-param assertion.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const PASSWORD = 'E2eTestPassword!23'
const EMAIL_WITH_REPS = `e2e-call-reps-${suffix}@example.test`
const EMAIL_NO_REPS = `e2e-call-noreps-${suffix}@example.test`

const FULL_IDENTIFIER = `hr-e2e-call-${suffix}-119`
const BILL_TITLE = `E2E Bill ${suffix}: Call Loop Coverage`
const SCRIPT_TEXT = `CACHED-CALL-SCRIPT-${suffix} — Hello, I'm calling about this bill. Please vote in favor. Thank you.`
const REP_BIOGUIDE = `E2E${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`
const REP_NAME = `E2E Rep ${suffix}`

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

let userWithRepsId: string | null = null
let userNoRepsId: string | null = null
let billId: string | null = null
let repId: string | null = null
let scriptIdWithReps: string | null = null

async function seedScript(userId: string, bId: string): Promise<string> {
  const { data, error } = await admin
    .from('script_generations')
    .insert({
      user_id: userId,
      bill_id: bId,
      stance: 'support',
      script_text: SCRIPT_TEXT,
      prompt_hash: 'e2e-seed-hash',
      model: 'claude-haiku-4-5',
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

test.beforeAll(async () => {
  const withReps = await admin.auth.admin.createUser({
    email: EMAIL_WITH_REPS,
    password: PASSWORD,
    email_confirm: true,
  })
  if (withReps.error) throw withReps.error
  userWithRepsId = withReps.data.user.id

  const noReps = await admin.auth.admin.createUser({
    email: EMAIL_NO_REPS,
    password: PASSWORD,
    email_confirm: true,
  })
  if (noReps.error) throw noReps.error
  userNoRepsId = noReps.data.user.id

  const bill = await admin
    .from('bills')
    .insert({
      congress_number: 119,
      bill_type: 'hr',
      bill_number: 9995,
      full_identifier: FULL_IDENTIFIER,
      title: BILL_TITLE,
      summary_text: `End-to-end summary ${suffix}.`,
      sponsor_bioguide_id: 'TEST_E2E_SPONSOR',
      introduced_date: '2026-05-01',
      last_action_date: '2026-05-20',
      last_action_text: 'Referred to Committee on End-to-End Testing',
      status: 'committee',
      congress_gov_url: `https://example.test/bill/${FULL_IDENTIFIER}`,
      urgency_score: 0.99,
    })
    .select('id')
    .single()
  if (bill.error) throw bill.error
  billId = bill.data.id

  const rep = await admin
    .from('representatives')
    .insert({
      bioguide_id: REP_BIOGUIDE,
      full_name: REP_NAME,
      first_name: 'E2E',
      last_name: 'Rep',
      party: 'Independent',
      state: 'CA',
      district: '12',
      chamber: 'house',
      dc_office_phone: '202-555-0143',
      term_start: '2025-01-03',
      term_end: '2027-01-03',
    })
    .select('id')
    .single()
  if (rep.error) throw rep.error
  repId = rep.data.id

  const link = await admin.from('user_representatives').insert({
    user_id: userWithRepsId,
    representative_id: repId,
    relationship_type: 'house',
  })
  if (link.error) throw link.error

  scriptIdWithReps = await seedScript(userWithRepsId, billId)
  // userNoReps also needs a cached script so they can save + reveal CallFlow.
  await seedScript(userNoRepsId, billId)
})

test.afterAll(async () => {
  // User deletes cascade their script_generations / call_events /
  // user_representatives rows; the shared bill + rep are deleted explicitly.
  if (userWithRepsId) await admin.auth.admin.deleteUser(userWithRepsId)
  if (userNoRepsId) await admin.auth.admin.deleteUser(userNoRepsId)
  if (repId) await admin.from('representatives').delete().eq('id', repId)
  if (billId) await admin.from('bills').delete().eq('id', billId)
})

async function loginAndSaveScript(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)

  await page.goto(`/bills/${billId}`)
  await expect(page.getByRole('heading', { name: BILL_TITLE })).toBeVisible()

  await page.getByRole('button', { name: 'Support', exact: true }).click()
  await page.getByRole('button', { name: 'Get my script', exact: true }).click()
  await expect(page.getByLabel('Script')).toHaveValue(new RegExp(`CACHED-CALL-SCRIPT-${suffix}`))
  await page.getByRole('button', { name: 'Save & Review', exact: true }).click()
}

test('full loop: save script, tap to call, confirm, and log a call_event', async ({ page }) => {
  await loginAndSaveScript(page, EMAIL_WITH_REPS)

  // CallFlow reveals once the script is saved; the seeded rep card renders.
  await expect(page.getByRole('heading', { name: 'Make the call' })).toBeVisible()
  await expect(page.getByText(REP_NAME)).toBeVisible()

  // Tap to call — the tel: anchor is a no-op in headless chromium, but its
  // onClick opens the self-report prompt.
  await page.getByRole('link', { name: 'Tap to call', exact: true }).click()
  await expect(page.getByText('Did you make the call?')).toBeVisible()

  await page.getByRole('button', { name: 'Yes, I called', exact: true }).click()
  await expect(page.getByText('Call logged.')).toBeVisible()

  // Authoritative check: a call_events row exists for (user, bill, rep) and
  // carries the seeded script_generation_id audit link.
  const { data: events, error } = await admin
    .from('call_events')
    .select('bill_id, representative_id, script_generation_id')
    .eq('user_id', userWithRepsId!)
  expect(error).toBeNull()
  expect(events).toHaveLength(1)
  expect(events![0].bill_id).toBe(billId)
  expect(events![0].representative_id).toBe(repId)
  expect(events![0].script_generation_id).toBe(scriptIdWithReps)
})

test('no-reps branch: shows Add my address with the return param', async ({ page }) => {
  await loginAndSaveScript(page, EMAIL_NO_REPS)

  // No user_representatives + no address → the "add your address" branch.
  await expect(
    page.getByText("We don't have your federal representatives on file yet", { exact: false }),
  ).toBeVisible()

  // The CTA carries the encoded return param back to this bill.
  const expectedHref = `/representatives?return=${encodeURIComponent(`/bills/${billId}`)}`
  const addLink = page.locator('a', { hasText: 'Add my address' })
  await expect(addLink).toHaveAttribute('href', expectedHref)

  // And no call_events were logged for this user.
  const { data: events } = await admin
    .from('call_events')
    .select('id')
    .eq('user_id', userNoRepsId!)
  expect(events ?? []).toHaveLength(0)
})
