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

export function urgencyLabel(score: number): { label: string; color: string } {
  if (score >= 0.85) return { label: 'Vote imminent', color: 'text-red-600 bg-red-50' }
  if (score >= 0.65) return { label: 'Vote soon', color: 'text-orange-600 bg-orange-50' }
  if (score >= 0.4) return { label: 'In progress', color: 'text-yellow-600 bg-yellow-50' }
  return { label: 'Introduced', color: 'text-slate-500 bg-slate-100' }
}

export function partyColor(party: string | null): string {
  if (!party) return 'bg-slate-200 text-slate-700'
  const p = party.toLowerCase()
  if (p.includes('democrat')) return 'bg-blue-100 text-blue-700'
  if (p.includes('republican')) return 'bg-red-100 text-red-700'
  if (p.includes('independent')) return 'bg-purple-100 text-purple-700'
  return 'bg-slate-100 text-slate-700'
}

export function levelLabel(level: string): string {
  if (level === 'federal') return 'Federal'
  if (level === 'state') return 'State'
  return 'Local'
}
