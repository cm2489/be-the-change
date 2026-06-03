import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Feature 7 — "Your Impact" activity surface (/impact).
//
// Two throwaway users on the real project (same seed+cleanup pattern as
// feature-5-call.spec.ts), removed in afterAll:
//   - userWithCalls → one seeded bill + rep + call_event + script_generation;
//     drives the populated assertions. We assert the history renders the real
//     bill TITLE and rep NAME (not just a row count) so an embed-cardinality
//     regression — bills/representatives embedded as arrays instead of objects —
//     can't pass green: the page would fall back to "A bill" / "your
//     representative" and these assertions would fail.
//   - userEmpty → no data; drives the 0-calls empty state + user-scoping (the
//     other user's bill must not leak into this user's log).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for E2E tests.',
  )
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const PASSWORD = 'E2eTestPassword!23'
const EMAIL_WITH_CALLS = `e2e-impact-calls-${suffix}@example.test`
const EMAIL_EMPTY = `e2e-impact-empty-${suffix}@example.test`

const FULL_IDENTIFIER = `hr-e2e-impact-${suffix}-119`
const BILL_TITLE = `E2E Impact Bill ${suffix}: History Coverage Act`
const REP_BIOGUIDE = `E2E${suffix.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`
const REP_NAME = `E2E Rep ${suffix}`

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

let userWithCallsId: string | null = null
let userEmptyId: string | null = null
let billId: string | null = null
let repId: string | null = null

test.beforeAll(async () => {
  const withCalls = await admin.auth.admin.createUser({
    email: EMAIL_WITH_CALLS,
    password: PASSWORD,
    email_confirm: true,
  })
  if (withCalls.error) throw withCalls.error
  userWithCallsId = withCalls.data.user.id

  const empty = await admin.auth.admin.createUser({
    email: EMAIL_EMPTY,
    password: PASSWORD,
    email_confirm: true,
  })
  if (empty.error) throw empty.error
  userEmptyId = empty.data.user.id

  const bill = await admin
    .from('bills')
    .insert({
      congress_number: 119,
      bill_type: 'hr',
      bill_number: 9990,
      full_identifier: FULL_IDENTIFIER,
      title: BILL_TITLE,
      summary_text: `Impact e2e summary ${suffix}.`,
      sponsor_bioguide_id: 'TEST_E2E_IMPACT_SPONSOR',
      introduced_date: '2026-05-01',
      last_action_date: '2026-05-20',
      last_action_text: 'Referred to committee',
      status: 'committee',
      congress_gov_url: `https://example.test/bill/${FULL_IDENTIFIER}`,
      urgency_score: 0.5,
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
      dc_office_phone: '202-555-0177',
      term_start: '2025-01-03',
      term_end: '2027-01-03',
    })
    .select('id')
    .single()
  if (rep.error) throw rep.error
  repId = rep.data.id

  // One generated script + one logged call for the populated user.
  const script = await admin
    .from('script_generations')
    .insert({
      user_id: userWithCallsId,
      bill_id: billId,
      stance: 'support',
      script_text: `E2E impact script ${suffix}.`,
      prompt_hash: `impact-${suffix}`,
      model: 'claude-haiku-4-5',
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
    })
    .select('id')
    .single()
  if (script.error) throw script.error

  const call = await admin.from('call_events').insert({
    user_id: userWithCallsId,
    bill_id: billId,
    representative_id: repId,
    script_generation_id: script.data.id,
  })
  if (call.error) throw call.error
})

test.afterAll(async () => {
  // User deletes cascade their call_events / script_generations; the shared
  // bill + rep are removed explicitly.
  if (userWithCallsId) await admin.auth.admin.deleteUser(userWithCallsId)
  if (userEmptyId) await admin.auth.admin.deleteUser(userEmptyId)
  if (repId) await admin.from('representatives').delete().eq('id', repId)
  if (billId) await admin.from('bills').delete().eq('id', billId)
})

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)
}

test('populated: history renders the real bill title + rep name, row links to the bill', async ({
  page,
}) => {
  await login(page, EMAIL_WITH_CALLS)
  await page.goto('/impact')

  await expect(page.getByRole('heading', { name: 'Your Impact' })).toBeVisible()
  await expect(page.getByText('Calls made')).toBeVisible()
  await expect(page.getByText('Scripts generated')).toBeVisible()

  // The history row must render the joined bill TITLE and rep NAME. If the
  // bills/representatives embed regressed to array cardinality, the page would
  // render its "A bill" / "your representative" fallbacks and these would fail.
  await expect(page.getByText(BILL_TITLE)).toBeVisible()
  await expect(page.getByText(`Called ${REP_NAME}`)).toBeVisible()

  // The whole row links to the bill detail page. NAVIGATE it (not just check
  // the href) and assert the detail page actually renders — proves the link's
  // param resolves (bills.id == call_events.bill_id), so a wrong-param regression
  // or a detail route that 404s the uuid fails red instead of passing on a
  // matching-but-dead href string.
  const escaped = BILL_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const row = page.getByRole('link', { name: new RegExp(escaped) })
  await expect(row).toHaveAttribute('href', `/bills/${billId}`)
  await row.click()
  await page.waitForURL(`**/bills/${billId}`)
  await expect(page.getByRole('heading', { name: BILL_TITLE })).toBeVisible()
})

test('empty: shows the 0-calls empty state and not another user’s calls', async ({ page }) => {
  await login(page, EMAIL_EMPTY)
  await page.goto('/impact')

  await expect(page.getByRole('heading', { name: 'Your Impact' })).toBeVisible()
  await expect(page.getByText('No calls logged yet')).toBeVisible()

  // User-scoping: the populated user's bill must not appear in this user's log.
  await expect(page.getByText(BILL_TITLE)).toHaveCount(0)
})
