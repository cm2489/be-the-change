// Keyword-based bill → interest tagger.
//
// Output goes into `bills.issue_tags` as a flat text[] containing both
// subcategory ids (matched directly) and their parent category ids
// (derived). The personalized-feed RPC intersects these against
// `user_interests.category` — which carries top-level category ids
// only — so the relevance match works whether the user picked a whole
// category or specific subcategories.
//
// Source of truth for category/subcategory ids: lib/interests.ts.
// The module-load validation block below throws on drift between this
// file and the canonical taxonomy so the tagger refuses to run with a
// stale ruleset.

import { INTEREST_CATEGORIES, ALL_SUBCATEGORY_IDS } from './interests'

// Each rule: if any keyword appears in the bill text, assign that subcategory id.
const KEYWORD_RULES: Array<{ keywords: string[]; interest_id: string }> = [
  // Environment
  { keywords: ['carbon', 'emissions', 'climate change', 'greenhouse gas', 'paris agreement', 'global warming'], interest_id: 'env_climate_policy' },
  { keywords: ['solar', 'wind energy', 'clean energy', 'renewable energy', 'electric vehicle', 'fossil fuel', 'offshore wind'], interest_id: 'env_clean_energy' },
  { keywords: ['clean water', 'water quality', 'ocean', 'wetland', 'pfas', 'superfund', 'epa'], interest_id: 'env_water' },
  { keywords: ['national park', 'public land', 'endangered species', 'wildlife', 'blm', 'forest service', 'wilderness'], interest_id: 'env_public_lands' },

  // Healthcare
  { keywords: ['medicaid', 'medicare', 'health insurance', 'affordable care act', 'aca', 'uninsured', 'chip'], interest_id: 'hc_access' },
  { keywords: ['insulin', 'drug pricing', 'pharmaceutical', 'prescription drug', 'drug cost', 'pharmacy'], interest_id: 'hc_drugs' },
  { keywords: ['mental health', 'behavioral health', 'suicide prevention', 'opioid', 'substance abuse', 'psychiatric'], interest_id: 'hc_mental' },
  { keywords: ['abortion', 'reproductive health', 'contraception', 'planned parenthood', 'roe', 'dobbs', 'prenatal'], interest_id: 'hc_reproductive' },

  // Education
  { keywords: ['k-12', 'public school', 'elementary', 'secondary education', 'school funding', 'idea', 'title i', 'teacher'], interest_id: 'edu_k12' },
  { keywords: ['student loan', 'college', 'university', 'tuition', 'pell grant', 'higher education', 'fafsa', 'student debt'], interest_id: 'edu_higher' },
  { keywords: ['vocational', 'apprenticeship', 'trade school', 'workforce training', 'career and technical'], interest_id: 'edu_vocational' },

  // Democracy
  { keywords: ['voting rights', 'voter id', 'voter registration', 'election security', 'ballot', 'polling place', 'voter access', 'vote by mail'], interest_id: 'dem_voting' },
  { keywords: ['campaign finance', 'super pac', 'citizens united', 'dark money', 'lobbying', 'political donation', 'fec'], interest_id: 'dem_campaign' },
  { keywords: ['redistricting', 'gerrymandering', 'census', 'apportionment', 'district lines', 'independent redistricting'], interest_id: 'dem_gerrymandering' },

  // Economy
  { keywords: ['minimum wage', 'worker rights', 'labor union', 'collective bargaining', 'nlrb', 'overtime pay', 'workers'], interest_id: 'econ_wages' },
  { keywords: ['income tax', 'corporate tax', 'estate tax', 'irs', 'tax cut', 'tax reform', 'tax credit', 'tax rate'], interest_id: 'econ_taxes' },
  { keywords: ['affordable housing', 'rent control', 'zoning', 'eviction', 'mortgage', 'housing assistance', 'homeless'], interest_id: 'econ_housing' },
  { keywords: ['tariff', 'trade agreement', 'import duty', 'export', 'manufacturing jobs', 'usmca', 'trade deficit'], interest_id: 'econ_trade' },

  // Immigration
  { keywords: ['citizenship', 'naturalization', 'daca', 'dreamer', 'undocumented', 'visa', 'green card', 'immigration reform'], interest_id: 'imm_pathways' },
  { keywords: ['border security', 'border patrol', 'cbp', 'ice', 'detention center', 'border wall', 'illegal immigration', 'unauthorized entry'], interest_id: 'imm_border' },
  { keywords: ['asylum', 'refugee', 'humanitarian protection', 'tps', 'temporary protected status', 'uscis'], interest_id: 'imm_asylum' },

  // Criminal Justice
  { keywords: ['mandatory minimum', 'sentencing reform', 'mass incarceration', 'prison reform', 'parole', 'probation', 'recidivism'], interest_id: 'jus_reform' },
  { keywords: ['police', 'law enforcement', 'use of force', 'qualified immunity', 'body camera', 'police accountability', 'officer misconduct'], interest_id: 'jus_police' },
  { keywords: ['marijuana', 'cannabis', 'drug decriminalization', 'drug enforcement', 'dea', 'drug scheduling'], interest_id: 'jus_drugpolicy' },

  // Civil Rights
  { keywords: ['racial equity', 'reparations', 'racial discrimination', 'affirmative action', 'civil rights', 'racial justice'], interest_id: 'cr_racial' },
  { keywords: ['lgbtq', 'transgender', 'same-sex', 'gender identity', 'non-discrimination', 'sexual orientation', 'equality act'], interest_id: 'cr_lgbtq' },
  { keywords: ['disability', 'ada', 'accessibility', 'reasonable accommodation', 'section 504', 'disability rights'], interest_id: 'cr_disability' },
  { keywords: ['reproductive rights', 'abortion access', "women's health", "women's rights", 'bodily autonomy', 'contraceptive'], interest_id: 'cr_reproductive' },

  // Gun Safety
  { keywords: ['background check', 'gun purchase', 'nics', 'firearm background', 'universal background'], interest_id: 'gun_background' },
  { keywords: ['red flag', 'extreme risk protection', 'erpo', 'gun safety', 'gun violence', 'mass shooting'], interest_id: 'gun_red_flag' },
  { keywords: ['assault weapon', 'ar-15', 'semiautomatic', 'high-capacity magazine', 'assault rifle'], interest_id: 'gun_assault' },

  // Technology
  { keywords: ['data privacy', 'surveillance', 'data collection', 'privacy law', 'gdpr', 'ccpa', 'consumer privacy', 'data breach'], interest_id: 'tech_privacy' },
  { keywords: ['artificial intelligence', 'ai regulation', 'algorithmic', 'machine learning', 'ai safety', 'automated decision'], interest_id: 'tech_ai' },
  { keywords: ['antitrust', 'tech monopoly', 'big tech', 'platform competition', 'anti-competitive', 'market power'], interest_id: 'tech_monopoly' },
]

// Subcategory id → parent category id, derived once at module load from
// INTEREST_CATEGORIES so a single source of truth defines parentage.
const SUBCATEGORY_TO_CATEGORY: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>()
  for (const cat of INTEREST_CATEGORIES) {
    for (const sub of cat.subcategories) {
      map.set(sub.id, cat.id)
    }
  }
  return map
})()

// Module-load taxonomy lock. Throws at import time if any rule's
// `interest_id` is not a real subcategory id in lib/interests.ts.
// Catches drift before tagging output corrupts bills.issue_tags.
const VALID_SUBCATEGORY_IDS: ReadonlySet<string> = new Set(ALL_SUBCATEGORY_IDS)
const DRIFTED_RULE_IDS = KEYWORD_RULES
  .map(r => r.interest_id)
  .filter(id => !VALID_SUBCATEGORY_IDS.has(id))
if (DRIFTED_RULE_IDS.length > 0) {
  throw new Error(
    `bill-tagger: KEYWORD_RULES references unknown subcategory ids — ` +
    `${DRIFTED_RULE_IDS.join(', ')}. Update either KEYWORD_RULES or ` +
    `lib/interests.ts INTEREST_CATEGORIES so they agree.`
  )
}

export interface TagBillResult {
  /** Subcategory ids (e.g. `env_clean_energy`) matched by keyword rules. */
  subcategory_ids: string[]
  /** Parent category ids (e.g. `environment`), derived from each subcategory match. */
  category_ids: string[]
}

/**
 * Tag a bill against the interest taxonomy by keyword presence in
 * title + summary. Returns matched subcategory ids and their derived
 * parent category ids; both arrays are deduped and order-stable
 * (insertion order). Both go into `bills.issue_tags` so the relevance
 * intersection works for category-only and subcategory-specific user
 * interests alike.
 */
export function tagBill(title: string, summary?: string | null): TagBillResult {
  const text = `${title} ${summary ?? ''}`.toLowerCase()
  const subs = new Set<string>()
  const cats = new Set<string>()

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      subs.add(rule.interest_id)
      const parent = SUBCATEGORY_TO_CATEGORY.get(rule.interest_id)
      if (parent) cats.add(parent)
    }
  }

  return {
    subcategory_ids: Array.from(subs),
    category_ids: Array.from(cats),
  }
}
