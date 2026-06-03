// Bill → interest tagger, re-anchored on CRS Policy Areas.
//
// PRIMARY path: a bill's CRS Policy Area (bill.policyArea.name, captured at
// sync time) maps 1:1 to one of our flat categories via
// POLICY_AREA_TO_CATEGORY. ~99% of bills carry a Policy Area, so this is
// the dominant path and yields exactly one category id.
//
// FALLBACK path: the ~1% of bills with NO Policy Area (3/482 at re-anchor
// time) fall back to keyword matching on title + summary, emitting flat
// category ids directly.
//
// Output goes into `bills.issue_tags` as a flat text[] of CATEGORY ids
// (e.g. `health`, `crime_justice`). get_personalized_feed intersects these
// against user_interests.category. Source of truth for category ids and
// the Policy Area → category map: lib/interests.ts.

import {
  ALL_CATEGORY_IDS,
  POLICY_AREA_TO_CATEGORY,
} from './interests'

// Keyword fallback rules. Each rule assigns ONE flat category id when any
// of its keywords appears in the bill text. This is the no-Policy-Area
// path only; the keyword corpus carries over from the pre-re-anchor tagger
// but now targets flat category ids instead of the retired subcategories.
const KEYWORD_RULES: Array<{ keywords: string[]; category_id: string }> = [
  // Environment & Energy
  { keywords: ['carbon', 'emissions', 'climate change', 'greenhouse gas', 'paris agreement', 'global warming'], category_id: 'environment_energy' },
  { keywords: ['solar', 'wind energy', 'clean energy', 'renewable energy', 'electric vehicle', 'fossil fuel', 'offshore wind'], category_id: 'environment_energy' },
  { keywords: ['clean water', 'water quality', 'ocean', 'wetland', 'pfas', 'superfund', 'epa'], category_id: 'environment_energy' },
  { keywords: ['national park', 'public land', 'endangered species', 'wildlife', 'blm', 'forest service', 'wilderness'], category_id: 'environment_energy' },

  // Health & Healthcare
  { keywords: ['medicaid', 'medicare', 'health insurance', 'affordable care act', 'aca', 'uninsured', 'chip'], category_id: 'health' },
  { keywords: ['insulin', 'drug pricing', 'pharmaceutical', 'prescription drug', 'drug cost', 'pharmacy'], category_id: 'health' },
  { keywords: ['mental health', 'behavioral health', 'suicide prevention', 'opioid', 'substance abuse', 'psychiatric'], category_id: 'health' },
  { keywords: ['abortion', 'reproductive health', 'contraception', 'planned parenthood', 'roe', 'dobbs', 'prenatal'], category_id: 'health' },

  // Education
  { keywords: ['k-12', 'public school', 'elementary', 'secondary education', 'school funding', 'idea', 'title i', 'teacher'], category_id: 'education' },
  { keywords: ['student loan', 'college', 'university', 'tuition', 'pell grant', 'higher education', 'fafsa', 'student debt'], category_id: 'education' },
  { keywords: ['vocational', 'apprenticeship', 'trade school', 'workforce training', 'career and technical'], category_id: 'education' },

  // Government & Democracy
  { keywords: ['voting rights', 'voter id', 'voter registration', 'election security', 'ballot', 'polling place', 'voter access', 'vote by mail'], category_id: 'government_democracy' },
  { keywords: ['campaign finance', 'super pac', 'citizens united', 'dark money', 'lobbying', 'political donation', 'fec'], category_id: 'government_democracy' },
  { keywords: ['redistricting', 'gerrymandering', 'census', 'apportionment', 'district lines', 'independent redistricting'], category_id: 'government_democracy' },

  // Jobs & the Economy
  { keywords: ['minimum wage', 'worker rights', 'labor union', 'collective bargaining', 'nlrb', 'overtime pay', 'workers'], category_id: 'jobs_economy' },
  { keywords: ['income tax', 'corporate tax', 'estate tax', 'irs', 'tax cut', 'tax reform', 'tax credit', 'tax rate'], category_id: 'jobs_economy' },
  { keywords: ['tariff', 'trade agreement', 'import duty', 'export', 'manufacturing jobs', 'usmca', 'trade deficit'], category_id: 'jobs_economy' },

  // Housing
  { keywords: ['affordable housing', 'rent control', 'zoning', 'eviction', 'mortgage', 'housing assistance', 'homeless'], category_id: 'housing' },

  // Immigration
  { keywords: ['citizenship', 'naturalization', 'daca', 'dreamer', 'undocumented', 'visa', 'green card', 'immigration reform'], category_id: 'immigration' },
  { keywords: ['border security', 'border patrol', 'cbp', 'ice', 'detention center', 'border wall', 'illegal immigration', 'unauthorized entry'], category_id: 'immigration' },
  { keywords: ['asylum', 'refugee', 'humanitarian protection', 'tps', 'temporary protected status', 'uscis'], category_id: 'immigration' },

  // Crime & Justice (incl. guns for MVP — see #guns-under-crime-mvp)
  { keywords: ['mandatory minimum', 'sentencing reform', 'mass incarceration', 'prison reform', 'parole', 'probation', 'recidivism'], category_id: 'crime_justice' },
  { keywords: ['police', 'law enforcement', 'use of force', 'qualified immunity', 'body camera', 'police accountability', 'officer misconduct'], category_id: 'crime_justice' },
  { keywords: ['marijuana', 'cannabis', 'drug decriminalization', 'drug enforcement', 'dea', 'drug scheduling'], category_id: 'crime_justice' },
  { keywords: ['background check', 'gun purchase', 'nics', 'firearm background', 'universal background'], category_id: 'crime_justice' },
  { keywords: ['red flag', 'extreme risk protection', 'erpo', 'gun safety', 'gun violence', 'mass shooting'], category_id: 'crime_justice' },
  { keywords: ['assault weapon', 'ar-15', 'semiautomatic', 'high-capacity magazine', 'assault rifle'], category_id: 'crime_justice' },

  // Rights & Liberties
  { keywords: ['racial equity', 'reparations', 'racial discrimination', 'affirmative action', 'civil rights', 'racial justice'], category_id: 'rights_liberties' },
  { keywords: ['lgbtq', 'transgender', 'same-sex', 'gender identity', 'non-discrimination', 'sexual orientation', 'equality act'], category_id: 'rights_liberties' },
  { keywords: ['disability', 'ada', 'accessibility', 'reasonable accommodation', 'section 504', 'disability rights'], category_id: 'rights_liberties' },
  { keywords: ['reproductive rights', 'abortion access', "women's health", "women's rights", 'bodily autonomy', 'contraceptive'], category_id: 'rights_liberties' },

  // AI & Technology
  { keywords: ['data privacy', 'surveillance', 'data collection', 'privacy law', 'gdpr', 'ccpa', 'consumer privacy', 'data breach'], category_id: 'ai_technology' },
  { keywords: ['artificial intelligence', 'ai regulation', 'algorithmic', 'machine learning', 'ai safety', 'automated decision'], category_id: 'ai_technology' },
  { keywords: ['antitrust', 'tech monopoly', 'big tech', 'platform competition', 'anti-competitive', 'market power'], category_id: 'ai_technology' },
]

// Module-load taxonomy lock. Throws at import time if any rule targets a
// category id that doesn't exist in lib/interests.ts — catches drift
// before tagging output corrupts bills.issue_tags.
const VALID_CATEGORY_IDS: ReadonlySet<string> = new Set(ALL_CATEGORY_IDS)
const DRIFTED_RULE_IDS = KEYWORD_RULES
  .map(r => r.category_id)
  .filter(id => !VALID_CATEGORY_IDS.has(id))
if (DRIFTED_RULE_IDS.length > 0) {
  throw new Error(
    `bill-tagger: KEYWORD_RULES reference unknown category ids — ` +
    `${[...new Set(DRIFTED_RULE_IDS)].join(', ')}. Update either KEYWORD_RULES ` +
    `or lib/interests.ts INTEREST_CATEGORIES so they agree.`,
  )
}

/**
 * Keyword fallback: flat category ids matched by keyword presence in
 * title + summary. Deduped, order-stable (insertion order). Used only
 * when a bill has no CRS Policy Area.
 */
export function tagFromKeywords(title: string, summary?: string | null): string[] {
  const text = `${title} ${summary ?? ''}`.toLowerCase()
  const cats = new Set<string>()
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      cats.add(rule.category_id)
    }
  }
  return Array.from(cats)
}

/**
 * Derive `bills.issue_tags` for a bill. Primary path maps the bill's CRS
 * Policy Area to its owning category (1:1, one tag). Fallback path runs
 * keyword matching for bills with no Policy Area. Returns a deduped flat
 * array of category ids.
 */
export function deriveIssueTags(
  policyArea: string | null,
  title: string,
  summary?: string | null,
): string[] {
  if (policyArea) {
    const categoryId = POLICY_AREA_TO_CATEGORY.get(policyArea)
    if (categoryId) return [categoryId]
    // Present but unmapped: shouldn't happen (interests.ts locks coverage
    // of all 32 known CRS areas), but a novel/renamed CRS term would land
    // here. Log it and fall through to keywords rather than drop the bill.
    console.warn(`[bill-tagger] unmapped CRS Policy Area "${policyArea}" — using keyword fallback`)
  }
  return tagFromKeywords(title, summary)
}
