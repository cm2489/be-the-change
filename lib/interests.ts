// Interest taxonomy — re-anchored on Congress.gov / CRS Policy Areas.
//
// 12 FLAT categories (no subcategories). Each maps 1:1 to a set of CRS
// Policy Areas; every bill carries exactly one Policy Area, so a bill's
// `issue_tags` is derived by mapping its Policy Area to the owning
// category (see lib/bill-tagger.ts). user_interests.category holds these
// same category ids, and get_personalized_feed intersects the two.
//
// Decision + evidence: docs/deferred.md#taxonomy-crs-reassess.
// Guns folded into Crime & Justice for MVP (#guns-under-crime-mvp);
// affordability deliberately NOT a category (#affordability-cross-cutting-filter).

export interface InterestCategory {
  id: string
  label: string
  /**
   * User-facing subline: 3–4 hot-button examples, for pull during
   * onboarding. DISPLAY COPY ONLY — never stored, never tagged against,
   * never used in feed logic.
   */
  subline: string
  /**
   * Exact CRS Policy Area strings this category owns. Drives tagging 1:1
   * and is the single source of truth for POLICY_AREA_TO_CATEGORY below.
   */
  policyAreas: string[]
}

// Order is salience-first (deliberate, easily changed — just reorder this
// array; nothing keys off position).
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'jobs_economy',
    label: 'Jobs & the Economy',
    subline: 'Jobs, wages, taxes, trade, inflation',
    policyAreas: [
      'Labor and Employment',
      'Commerce',
      'Finance and Financial Sector',
      'Taxation',
      'Economics and Public Finance',
      'Agriculture and Food',
      'Transportation and Public Works',
    ],
  },
  {
    id: 'ai_technology',
    label: 'AI & Technology',
    subline: 'AI regulation, data privacy, online safety',
    policyAreas: ['Science, Technology, Communications'],
  },
  {
    id: 'health',
    label: 'Health & Healthcare',
    subline: 'Medicare, drug prices, insurance, mental health',
    policyAreas: ['Health'],
  },
  {
    id: 'housing',
    label: 'Housing',
    subline: 'Affordable housing, rent, homelessness, mortgages',
    policyAreas: ['Housing and Community Development'],
  },
  {
    id: 'immigration',
    label: 'Immigration',
    subline: 'Border security, citizenship, asylum, visas',
    policyAreas: ['Immigration'],
  },
  {
    id: 'government_democracy',
    label: 'Government & Democracy',
    subline: 'Voting rights, campaign finance reform',
    policyAreas: [
      'Government Operations and Politics',
      'Congress',
      'Emergency Management',
    ],
  },
  {
    id: 'crime_justice',
    label: 'Crime & Justice',
    subline: 'Policing, gun laws, sentencing, drug policy',
    policyAreas: ['Crime and Law Enforcement', 'Law'],
  },
  {
    id: 'education',
    label: 'Education',
    subline: 'Public schools, student debt, college costs',
    policyAreas: ['Education', 'Sports and Recreation', 'Social Sciences and History'],
  },
  {
    id: 'environment_energy',
    label: 'Environment & Energy',
    subline: 'Climate, clean energy, public lands, clean water',
    policyAreas: [
      'Environmental Protection',
      'Energy',
      'Public Lands and Natural Resources',
      'Water Resources Development',
      'Animals',
    ],
  },
  {
    id: 'rights_liberties',
    label: 'Rights & Liberties',
    subline: 'Civil rights, LGBTQ+ rights, free speech, discrimination',
    policyAreas: ['Civil Rights and Liberties, Minority Issues'],
  },
  {
    id: 'national_security',
    label: 'National Security & Foreign Affairs',
    subline: 'Defense, the military, foreign policy, trade',
    policyAreas: [
      'Armed Forces and National Security',
      'International Affairs',
      'Foreign Trade and International Finance',
    ],
  },
  {
    id: 'family_community',
    label: 'Family & Community',
    subline: 'Family support, child care, support programs, tribal affairs',
    policyAreas: ['Families', 'Social Welfare', 'Native Americans', 'Arts, Culture, Religion'],
  },
]

export const ALL_CATEGORY_IDS: string[] = INTEREST_CATEGORIES.map(c => c.id)

// Reverse map: CRS Policy Area name → our flat category id (1:1). Built at
// module load; throws if any Policy Area is claimed by two categories.
export const POLICY_AREA_TO_CATEGORY: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>()
  for (const cat of INTEREST_CATEGORIES) {
    for (const pa of cat.policyAreas) {
      const existing = map.get(pa)
      if (existing) {
        throw new Error(
          `interests: CRS Policy Area "${pa}" is mapped to both ` +
          `"${existing}" and "${cat.id}". Each area must map to one category.`,
        )
      }
      map.set(pa, cat.id)
    }
  }
  return map
})()

// The full CRS Policy Area vocabulary (32 terms, per Congress.gov).
// Module-load COVERAGE LOCK: every term must be claimed by exactly one
// category, so the taxonomy can never ship with an unmapped area that
// would silently drop bills (the failure mode that motivated the
// re-anchor — see docs/deferred.md#taxonomy-crs-reassess).
export const CRS_POLICY_AREAS = [
  'Agriculture and Food',
  'Animals',
  'Armed Forces and National Security',
  'Arts, Culture, Religion',
  'Civil Rights and Liberties, Minority Issues',
  'Commerce',
  'Congress',
  'Crime and Law Enforcement',
  'Economics and Public Finance',
  'Education',
  'Emergency Management',
  'Energy',
  'Environmental Protection',
  'Families',
  'Finance and Financial Sector',
  'Foreign Trade and International Finance',
  'Government Operations and Politics',
  'Health',
  'Housing and Community Development',
  'Immigration',
  'International Affairs',
  'Labor and Employment',
  'Law',
  'Native Americans',
  'Public Lands and Natural Resources',
  'Science, Technology, Communications',
  'Social Sciences and History',
  'Social Welfare',
  'Sports and Recreation',
  'Taxation',
  'Transportation and Public Works',
  'Water Resources Development',
] as const

{
  const unmapped = CRS_POLICY_AREAS.filter(pa => !POLICY_AREA_TO_CATEGORY.has(pa))
  if (unmapped.length > 0) {
    throw new Error(
      `interests: ${unmapped.length} CRS Policy Area(s) have no category — ` +
      `${unmapped.join(', ')}. Every area in CRS_POLICY_AREAS must be claimed ` +
      `by a category's policyAreas.`,
    )
  }
}

export function getCategoryById(id: string): InterestCategory | undefined {
  return INTEREST_CATEGORIES.find(c => c.id === id)
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id
}
