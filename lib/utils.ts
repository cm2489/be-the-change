import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Date unknown'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

export type UrgencyVariant = 'urgent' | 'soon' | 'neutral' | 'passed'

export function urgencyLabel(score: number): { label: string; variant: UrgencyVariant } {
  if (score >= 0.85) return { label: 'Vote imminent', variant: 'urgent' }
  if (score >= 0.65) return { label: 'Vote soon', variant: 'soon' }
  if (score >= 0.4) return { label: 'In progress', variant: 'neutral' }
  return { label: 'Introduced', variant: 'neutral' }
}

export function partyLetter(party: string | null): 'D' | 'R' | 'I' | null {
  if (!party) return null
  const p = party.toLowerCase()
  if (p.includes('democrat')) return 'D'
  if (p.includes('republican')) return 'R'
  if (p.includes('independent')) return 'I'
  return null
}

export function levelLabel(level: string): string {
  if (level === 'federal') return 'Federal'
  if (level === 'state') return 'State'
  return 'Local'
}
