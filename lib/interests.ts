export interface InterestCategory {
  id: string
  label: string
  icon: string
  description: string
  subcategories: InterestSubcategory[]
}

export interface InterestSubcategory {
  id: string
  label: string
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'environment',
    label: 'Climate & Environment',
    icon: '🌍',
    description: 'Climate policy, clean energy, and environmental protection',
    subcategories: [
      { id: 'env_climate_policy', label: 'Climate Policy & Carbon' },
      { id: 'env_clean_energy', label: 'Clean Energy & Renewables' },
      { id: 'env_water', label: 'Water & Oceans' },
      { id: 'env_public_lands', label: 'Public Lands & Wildlife' },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    description: 'Healthcare access, drug costs, and mental health',
    subcategories: [
      { id: 'hc_access', label: 'Healthcare Access & Medicaid' },
      { id: 'hc_drugs', label: 'Prescription Drug Costs' },
      { id: 'hc_mental', label: 'Mental Health' },
      { id: 'hc_reproductive', label: 'Reproductive Rights' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    icon: '📚',
    description: 'Public schools, student debt, and higher education',
    subcategories: [
      { id: 'edu_k12', label: 'K-12 Funding & Schools' },
      { id: 'edu_higher', label: 'Higher Ed & Student Debt' },
      { id: 'edu_vocational', label: 'Vocational & Trade Programs' },
    ],
  },
  {
    id: 'democracy',
    label: 'Democracy & Voting',
    icon: '🗳️',
    description: 'Voting rights, elections, and campaign finance',
    subcategories: [
      { id: 'dem_voting', label: 'Voting Access & Election Security' },
      { id: 'dem_campaign', label: 'Campaign Finance Reform' },
      { id: 'dem_gerrymandering', label: 'Redistricting & Gerrymandering' },
    ],
  },
  {
    id: 'economy',
    label: 'Economy & Labor',
    icon: '💼',
    description: 'Wages, housing, taxes, and worker rights',
    subcategories: [
      { id: 'econ_wages', label: 'Minimum Wage & Worker Rights' },
      { id: 'econ_taxes', label: 'Tax Policy' },
      { id: 'econ_housing', label: 'Housing Affordability' },
      { id: 'econ_trade', label: 'Trade & Manufacturing' },
    ],
  },
  {
    id: 'immigration',
    label: 'Immigration',
    icon: '🤝',
    description: 'Immigration reform, asylum, and pathways to citizenship',
    subcategories: [
      { id: 'imm_pathways', label: 'Pathways to Citizenship' },
      { id: 'imm_border', label: 'Border Security' },
      { id: 'imm_asylum', label: 'Asylum & Refugee Policy' },
    ],
  },
  {
    id: 'justice',
    label: 'Criminal Justice',
    icon: '⚖️',
    description: 'Sentencing reform, policing, and drug policy',
    subcategories: [
      { id: 'jus_reform', label: 'Sentencing & Prison Reform' },
      { id: 'jus_police', label: 'Policing & Accountability' },
      { id: 'jus_drugpolicy', label: 'Drug Policy Reform' },
    ],
  },
  {
    id: 'civil_rights',
    label: 'Civil Rights & Equality',
    icon: '✊',
    description: 'LGBTQ+ rights, racial equity, and disability rights',
    subcategories: [
      { id: 'cr_racial', label: 'Racial Equity' },
      { id: 'cr_lgbtq', label: 'LGBTQ+ Rights' },
      { id: 'cr_reproductive', label: "Women's Bodily Autonomy" },
      { id: 'cr_disability', label: 'Disability Rights' },
    ],
  },
  {
    id: 'gun_safety',
    label: 'Gun Safety',
    icon: '🛡️',
    description: 'Background checks, red flag laws, and gun violence prevention',
    subcategories: [
      { id: 'gun_background', label: 'Universal Background Checks' },
      { id: 'gun_red_flag', label: 'Red Flag Laws' },
      { id: 'gun_assault', label: 'Assault Weapons Policy' },
    ],
  },
  {
    id: 'technology',
    label: 'Technology & Privacy',
    icon: '💻',
    description: 'Data privacy, AI regulation, and net neutrality',
    subcategories: [
      { id: 'tech_privacy', label: 'Data Privacy & Surveillance' },
      { id: 'tech_ai', label: 'AI Regulation' },
      { id: 'tech_monopoly', label: 'Tech Antitrust' },
    ],
  },
]

export const ALL_SUBCATEGORY_IDS = INTEREST_CATEGORIES.flatMap(c =>
  c.subcategories.map(s => s.id)
)

export function getCategoryById(id: string): InterestCategory | undefined {
  return INTEREST_CATEGORIES.find(c => c.id === id)
}

export function getSubcategoryLabel(id: string): string {
  for (const cat of INTEREST_CATEGORIES) {
    const sub = cat.subcategories.find(s => s.id === id)
    if (sub) return sub.label
  }
  return id
}
