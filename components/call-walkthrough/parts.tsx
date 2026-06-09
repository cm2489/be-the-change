import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Shared pieces for the CallWalkthrough demo screens. Everything here is
// decorative (it lives inside the aria-hidden phone) — the buttons are never real
// focus targets (tabIndex -1). TOKENS: in-screen text/motion are literal device-mock
// values, the same sanctioned exception as the locked `max-w-[65ch]`.

// Inline static pill — no Pill/Badge primitive exists yet; matches the app's
// existing inline pill (BillCard etc.): hairline outline, uppercase meta, ink-70.
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-pill border border-divider px-2.5 py-0.5 text-meta uppercase text-ink-70">
      {children}
    </span>
  )
}

// A CTA that can show a tap (ripple + press) or be "held" (press only). Wraps the
// real Button so the walkthrough can fake a click without a pointer. Always
// tabIndex -1 — it's a decorative demo, never a real focus target.
export function TapCTA({
  tap,
  held = false,
  ripple = 'bg-ink/15',
  wrapClassName,
  children,
  ...props
}: ButtonProps & { tap: boolean; held?: boolean; ripple?: string; wrapClassName?: string }) {
  return (
    <div className={cn('relative', wrapClassName)}>
      <div className={cn('transition-transform duration-micro ease-standard', (tap || held) && 'scale-[0.97]')}>
        <Button tabIndex={-1} {...props}>
          {children}
        </Button>
      </div>
      {tap && (
        <span
          aria-hidden
          className={cn('pointer-events-none absolute inset-0 m-auto h-12 w-12 rounded-pill animate-ping', ripple)}
        />
      )}
    </div>
  )
}

// Static stance control — mirrors the ScriptFlow Support/Oppose/Undecided pattern
// (active = ink fill / paper text; idle = white + divider-strong border).
export function StanceToggleStatic() {
  return (
    <div className="flex flex-wrap gap-2">
      {(['Support', 'Oppose', 'Undecided'] as const).map((opt) => (
        <span
          key={opt}
          className={cn(
            'rounded-md px-3 py-2 text-control font-medium',
            opt === 'Support' ? 'bg-ink text-paper' : 'border border-divider-strong bg-card text-ink',
          )}
        >
          {opt}
        </span>
      ))}
    </div>
  )
}

export function AppBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-divider px-3.5">
      <ChevronLeft className="h-4 w-4 text-ink-50" aria-hidden />
      <span className="whitespace-nowrap font-mono text-[11px] text-ink-70">{children}</span>
      <span className="w-4" aria-hidden />
    </div>
  )
}
