import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// E2E for the urgency-banded feed: the chip-rail topic filter, band headers, and
// the three personalization prompt states (0 / 1 / 2+ interests).
//
// Seeds three bills with controlled issue_tags + status (→ band) + high
// urgency_score (so they land on feed page 1), and three users with 0/1/2
// interests. Real Supabase; everything torn down in afterAll.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env — required for E2E tests.')
}
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const PASSWORD = 'E2eTestPassword!23'
const HEALTH_IMMINENT = `Feed E2E ${suffix}: Health Floor Vote Bill`
const HEALTH_COMMITTEE = `Feed E2E ${suffix}: Health Committee Bill`
const HOUSING_COMMITTEE = `Feed E2E ${suffix}: Housing Committee Bill`

type Seed = { title: string; ident: string; tags: string[]; status: string; urgency: number; num: number }
const SEEDS: Seed[] = [
  { title: HEALTH_IMMINENT, ident: `hr-feed-${suffix}-1`, tags: ['health'], status: 'floor_vote', urgency: 0.99, num: 9001 },
  { title: HEALTH_COMMITTEE, ident: `hr-feed-${suffix}-2`, tags: ['health'], status: 'committee', urgency: 0.97, num: 9002 },
  { title: HOUSING_COMMITTEE, ident: `hr-feed-${suffix}-3`, tags: ['housing'], status: 'committee', urgency: 0.96, num: 9003 },
]

const billIds: string[] = []
const userIds: string[] = []
let u0Email = '', u1Email = '', u2Email = ''

async function makeUser(label: string, categories: string[]): Promise<string> {
  const email = `e2e-feed-${label}-${suffix}@example.test`
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true })
  if (error) throw error
  userIds.push(data.user.id)
  if (categories.length) {
    const { error: ie } = await admin
      .from('user_interests')
      .insert(categories.map((category, i) => ({ user_id: data.user.id, category, subcategory: null, rank: i + 1 })))
    if (ie) throw ie
  }
  return email
}

test.beforeAll(async () => {
  for (const s of SEEDS) {
    const { data, error } = await admin
      .from('bills')
      .insert({
        congress_number: 119,
        bill_type: 'hr',
        bill_number: s.num,
        full_identifier: s.ident,
        title: s.title,
        summary_text: 'Plain-language summary for the feed E2E bill.',
        sponsor_bioguide_id: 'TEST_E2E_FEED',
        introduced_date: '2026-01-01',
        last_action_date: '2026-05-20',
        last_action_text: 'Referred to Committee on End-to-End Testing',
        status: s.status,
        issue_tags: s.tags,
        congress_gov_url: `https://example.test/bill/${s.ident}`,
        urgency_score: s.urgency,
      })
      .select()
      .single()
    if (error) throw error
    billIds.push(data.id)
  }
  u0Email = await makeUser('zero', [])
  u1Email = await makeUser('one', ['health'])
  u2Email = await makeUser('two', ['health', 'housing'])
})

test.afterAll(async () => {
  for (const id of billIds) await admin.from('bills').delete().eq('id', id)
  for (const id of userIds) await admin.auth.admin.deleteUser(id)
})

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|onboarding)(\?|$|\/)/)
}

test('0 interests: personalize nudge + banded default feed, no chip rail', async ({ page }) => {
  await login(page, u0Email)
  await page.goto('/bills')

  await expect(page.getByText('Personalize your feed')).toBeVisible()
  // Banded: the seeded floor-vote bill puts a "Vote imminent" header on the feed.
  await expect(page.getByRole('heading', { name: 'Vote imminent' })).toBeVisible()
  // No topic chips for a user with no interests.
  await expect(page.getByRole('button', { name: 'All topics' })).toHaveCount(0)
})

test('2 interests: chip rail filters the banded feed', async ({ page }) => {
  await login(page, u2Email)
  await page.goto('/bills')

  // Chip rail: All topics + the two interest chips.
  await expect(page.getByRole('button', { name: 'All topics' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Health & Healthcare', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Housing', exact: true })).toBeVisible()

  // Both topics' bills are present under "All topics".
  await expect(page.getByText(HEALTH_IMMINENT)).toBeVisible()
  await expect(page.getByText(HOUSING_COMMITTEE)).toBeVisible()

  // Filter to Housing → housing bill stays, health bills drop out.
  await page.getByRole('button', { name: 'Housing', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Housing', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(HOUSING_COMMITTEE)).toBeVisible()
  await expect(page.getByText(HEALTH_IMMINENT)).toHaveCount(0)

  // Back to All topics → health bill returns.
  await page.getByRole('button', { name: 'All topics' }).click()
  await expect(page.getByText(HEALTH_IMMINENT)).toBeVisible()
})

test('1 interest: single chip + Add chip + docked AddInterestsBar', async ({ page }) => {
  await login(page, u1Email)
  await page.goto('/bills')

  await expect(page.getByRole('button', { name: 'Health & Healthcare', exact: true })).toBeVisible()
  // Two Add affordances link to /onboarding by spec (dashed chip + docked bar); assert one exists.
  await expect(page.getByRole('link', { name: 'Add', exact: true }).first()).toBeVisible()
  await expect(page.getByText('Add more interests')).toBeVisible() // docked bar
  await expect(page.getByRole('button', { name: 'All topics' })).toHaveCount(0) // no All topics with 1 interest
})
