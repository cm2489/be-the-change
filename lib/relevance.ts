import { INTEREST_CATEGORIES } from './interests'

export type RelevanceState = 'empty' | 'populated' | 'no_match'

export interface MatchedCategory {
  id: string
  label: string
}

export interface Relevance {
  state: RelevanceState
  matchedCategories: MatchedCategory[]
}

/**
 * Resolve the bill-detail relevance line ("Why this matters to you") from the
 * user's selected top-level interest categories and a bill's `issue_tags`.
 *
 * Matching is a RAW intersection on TOP-LEVEL CATEGORY ids only. This mirrors
 * `get_personalized_feed` exactly, so the detail page and the feed badge can
 * never disagree about whether a bill matches.
 *
 * It deliberately does NOT walk subcategory -> parent. The tagger
 * (`lib/bill-tagger.ts`) guarantees `issue_tags` carries the parent category id
 * whenever it emits a subcategory, so category-level matching already catches
 * subcategory-tagged bills. Walking parents in the matcher was the explicitly
 * rejected alternative (STRATEGY.md, 2026-04-28: "pushes complexity into SQL
 * where it's harder to debug"). The prior bug was the tagger emitting
 * subcategories WITHOUT parents — fixed at the tag layer, not here.
 *
 * Consequence, locked by `__tests__/relevance.test.ts`: a bare subcategory id
 * in `issue_tags` *without* its parent does not match. That input is malformed
 * per the tagger contract; the matcher correctly relies on the parent being
 * present. Iterating the canonical taxonomy also makes the output order-stable
 * and dedup-safe — each category appears at most once regardless of duplicate
 * or subcategory tags.
 *
 * @param userCategoryIds distinct top-level category ids (from `user_interests.category`)
 * @param billIssueTags   `bills.issue_tags` (subcategory + parent ids), or null
 */
export function resolveRelevance(
  userCategoryIds: string[],
  billIssueTags: string[] | null,
): Relevance {
  const userSet = new Set(userCategoryIds)
  if (userSet.size === 0) {
    return { state: 'empty', matchedCategories: [] }
  }

  const tagSet = new Set(billIssueTags ?? [])
  const matchedCategories = INTEREST_CATEGORIES.filter(
    c => userSet.has(c.id) && tagSet.has(c.id),
  ).map(c => ({ id: c.id, label: c.label }))

  return {
    state: matchedCategories.length > 0 ? 'populated' : 'no_match',
    matchedCategories,
  }
}
