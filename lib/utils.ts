import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The project overrides Tailwind's fontSize scale with custom names
// (display/h1/h2/h3/body/small/meta/mono/control). tailwind-merge ships knowing only
// the DEFAULT scale, so it doesn't recognize `text-small` etc. as font sizes — left
// alone it won't dedupe two of them, so a size override (e.g. a button's `lg` over its
// base) silently emits BOTH classes and lets the cascade decide. Register the custom
// names in the font-size group so a conflict resolves to the last token, as intended.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['display', 'h1', 'h2', 'h3', 'body', 'small', 'meta', 'mono', 'control'] },
      ],
    },
  },
})

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

export function levelLabel(level: string): string {
  if (level === 'federal') return 'Federal'
  if (level === 'state') return 'State'
  return 'Local'
}

// Bill-type prefixes for Congress citations (H.R. 4821 / S.J.Res. 139).
const BILL_TYPE_PREFIXES: Record<string, string> = {
  hr: 'H.R.',
  s: 'S.',
  hjres: 'H.J.Res.',
  sjres: 'S.J.Res.',
  hres: 'H.Res.',
  sres: 'S.Res.',
  hconres: 'H.Con.Res.',
  sconres: 'S.Con.Res.',
}

// Format a bill identifier as a Congress citation, e.g. "H.R. 4821" / "S. 1234".
export function billIdentifier(billType: string, billNumber: number): string {
  return `${BILL_TYPE_PREFIXES[billType.toLowerCase()] ?? billType.toUpperCase()} ${billNumber}`
}

// Format a stored full_identifier ("sjres-139-119") as a Congress citation
// ("S.J.Res. 139"). The feed RPCs return full_identifier, not bill_type/number,
// so the feed card formats from it; reuses billIdentifier for the prefix map.
// Falls back to the raw string if the identifier isn't the expected shape.
export function formatBillIdentifier(fullIdentifier: string): string {
  const [billType, billNumber] = fullIdentifier.split('-')
  if (!billType || !billNumber || Number.isNaN(Number(billNumber))) return fullIdentifier
  return billIdentifier(billType, Number(billNumber))
}
