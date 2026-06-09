import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppBar, Pill, StanceToggleStatic, TapCTA } from './parts'

// The five demo screens + their choreography, for CallWalkthrough. The shell
// component owns the state machine; this is the content. Everything is decorative
// (inside the aria-hidden phone) — the narrative is carried by the captions and
// the labeled dots. TOKENS: in-screen text/motion are literal device-mock values,
// the same sanctioned exception as the locked `max-w-[65ch]`.

export type Phase = 'idle' | 'tap' | 'calling'
export type Fx = { active: boolean; phase: Phase }

// Per-step timeline (ms): when to tap, when to "call", when to advance. Tuned so
// the loop plays like a recording rather than a slideshow.
export const SCHEDULE: Array<Array<[number, 'tap' | 'calling' | 'advance']>> = [
  [[2800, 'advance']], // Decode — a reading beat
  [[1500, 'tap'], [2050, 'advance']], // Stance — tap "Get my script"
  [[1700, 'tap'], [2250, 'advance']], // Script — edit caret, tap "Save & Review"
  [[1300, 'tap'], [1850, 'calling'], [2750, 'advance']], // Call — tap, then "Calling…"
  [[2900, 'advance']], // Logged — the payoff
]

export type Screen = { label: string; caption: string; render: (fx: Fx) => ReactNode }

export const SCREENS: Screen[] = [
  {
    label: 'Decode',
    caption: 'Read the bill in plain language.',
    render: () => (
      <div className="flex h-full flex-col">
        <AppBar>H.R. 4821</AppBar>
        <div className="px-3.5 pt-3.5">
          <div className="mb-2.5 flex gap-1.5">
            <Pill>Vote imminent</Pill>
          </div>
          <p className="mb-3 line-clamp-3 font-serif text-[12.5px] italic leading-[1.35] text-ink-70">
            To amend title 49, United States Code, to require air carriers to disclose ancillary
            fees at the time of booking.
          </p>
          <div className="rounded-[16px] border border-divider bg-card p-3.5">
            <p className="mb-0.5 font-serif text-[12.5px] text-ink-70">Decoded</p>
            <p className="font-sans text-[15px] font-medium leading-[1.25] text-ink">
              Airline Fees — Show Costs Upfront
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.4] text-ink-70">
              Airlines would have to show bag and seat fees before you pay, not at checkout.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: 'Stance',
    caption: 'Choose where you stand — your call, never ours.',
    render: (fx) => (
      <div className="flex h-full flex-col">
        <AppBar>H.R. 4821</AppBar>
        <div className="px-3.5 py-[18px]">
          <p className="mb-2.5 font-sans text-[11px] uppercase tracking-widest text-ink-50">Take action</p>
          <p className="font-serif text-[20px] text-ink">Where do you stand?</p>
          <div className="mt-3.5">
            <StanceToggleStatic />
          </div>
          <TapCTA tap={fx.phase === 'tap'} ripple="bg-paper/30" size="lg" wrapClassName="mt-[18px]" className="w-full">
            Get my script
          </TapCTA>
        </div>
      </div>
    ),
  },
  {
    label: 'Script',
    caption: 'Get a respectful script — always yours to edit first.',
    render: (fx) => (
      <div className="flex h-full flex-col">
        <AppBar>H.R. 4821</AppBar>
        <div className="px-3.5 py-[18px]">
          <p className="mb-2.5 font-sans text-[11px] uppercase tracking-widest text-ink-50">Call script</p>
          <p className="mb-2.5 text-caption text-ink-70">AI-drafted. Review before you call.</p>
          <div className="rounded-md border border-divider-strong bg-paper p-3 text-[12.5px] leading-[1.55] text-ink-85">
            Hi, my name is Maria and I&rsquo;m a constituent in Cleveland. I&rsquo;m calling to ask the
            Senator to support H.R. 4821, which would require airlines to show fees upfront. Thank you.
            {fx.active && (
              <span
                aria-hidden
                className="ml-px inline-block h-[1.1em] w-px translate-y-[2px] animate-pulse bg-ink-70 align-middle motion-reduce:animate-none"
              />
            )}
          </div>
          <TapCTA tap={fx.phase === 'tap'} ripple="bg-ink/12" variant="outline" wrapClassName="mt-3.5" className="w-full">
            Save &amp; Review
          </TapCTA>
        </div>
      </div>
    ),
  },
  {
    label: 'Call',
    caption: 'Call your House rep and two Senators in one tap.',
    render: (fx) => (
      <div className="flex h-full flex-col">
        <AppBar>Make the call</AppBar>
        <div className="px-3.5 py-[18px]">
          <p className="mb-2.5 font-sans text-[11px] uppercase tracking-widest text-ink-50">
            Your representatives
          </p>
          <div className="rounded-[16px] border border-divider bg-paper-mid p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-small font-semibold text-ink">Maria Delgado</div>
                <div className="text-[13px] text-ink-70">U.S. Senator, OH</div>
              </div>
              <Pill>Democrat</Pill>
            </div>
            <div className="my-2.5 font-mono text-small text-ink">202-224-2315</div>
            <TapCTA
              tap={fx.phase === 'tap'}
              held={fx.phase === 'calling'}
              ripple="bg-white/40"
              variant="signal"
              size="sm"
              className="w-full"
            >
              {fx.phase === 'calling' ? 'Calling…' : 'Tap to call'}
            </TapCTA>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: 'Logged',
    caption: 'Every call you make, tracked in one place.',
    render: (fx) => (
      <div className="flex h-full flex-col">
        <AppBar>Make the call</AppBar>
        <div className="px-5 py-10 text-center">
          <div
            className={cn(
              'inline-flex h-[52px] w-[52px] items-center justify-center rounded-pill bg-moss-10 text-moss transition-all duration-component ease-standard motion-reduce:transition-none',
              fx.active ? 'scale-100 opacity-100 delay-100' : 'scale-75 opacity-0',
            )}
          >
            <Check className="h-[22px] w-[22px]" aria-hidden />
          </div>
          <p className="mt-4 font-serif text-[20px] text-ink">Call logged</p>
          <p className="mt-1 text-[12.5px] text-ink-70">Maria Delgado &middot; just now</p>
          <Button tabIndex={-1} variant="outline" size="sm" className="mt-5">
            Next bill
          </Button>
        </div>
      </div>
    ),
  },
]

export const N = SCREENS.length
