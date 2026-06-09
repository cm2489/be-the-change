'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCREENS, SCHEDULE, N, type Phase } from './screens'

// CallWalkthrough — an embedded, auto-advancing mock of the Oravan call flow
// (Decode → Stance → Script → Call → Logged) inside a minimal phone frame, for
// the landing's "How it works" section. Static demo copy, no data fetching.
//
// Choreographed to read like a screen recording: each action screen taps its own
// CTA (touch ripple + brief press) before advancing, the Call screen shows a
// "Calling…" beat, the Logged screen pops in, the Script box blinks an edit caret.
// Autoplays, pauses on hover/focus, loops; honors prefers-reduced-motion (starts
// paused, no motion). The phone visuals are decorative (aria-hidden + non-focusable
// demo controls); SR users get the story from the captions and the labeled dots.
//
// The phone is a fixed 288px "device mock"; on very narrow screens it would overflow
// the column, so a sizing wrapper shrinks the footprint and scales the phone to fit.

export function CallWalkthrough() {
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [playing, setPlaying] = useState(true)
  const [paused, setPaused] = useState(false) // transient hover/focus pause
  const [reduce, setReduce] = useState(false)

  // Reduced motion: start paused and never autoplay/animate (checked client-side).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      setReduce(mq.matches)
      if (mq.matches) setPlaying(false)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Choreography: run the current step's timeline, then advance (loops). Pausing
  // clears the timers and resets the press so nothing freezes mid-tap.
  useEffect(() => {
    if (reduce) return
    if (!playing || paused) {
      setPhase('idle')
      return
    }
    setPhase('idle')
    const timers = SCHEDULE[i].map(([at, action]) =>
      setTimeout(() => {
        if (action === 'advance') {
          setPhase('idle')
          setI((p) => (p + 1) % N)
        } else {
          setPhase(action)
        }
      }, at),
    )
    return () => timers.forEach(clearTimeout)
  }, [i, playing, paused, reduce])

  const go = (idx: number) => {
    setPhase('idle')
    setI((idx + N) % N)
  }

  const iconBtn =
    'inline-flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-divider text-ink transition-colors duration-micro ease-standard hover:bg-ink-10 focus-visible:shadow-focus focus-visible:outline-none'

  return (
    <div
      className="flex flex-col items-center"
      role="group"
      aria-label="Walkthrough: making a call with Oravan"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <p className="mb-4 self-start font-sans text-[11px] font-medium uppercase tracking-widest text-ink-50">
        Making a call
      </p>

      {/* Sizing wrapper: shrink the 288px phone's footprint on ≤360px screens so it
          can't overflow the column; the phone scales to fit. */}
      <div className="h-[496px] w-72 max-[360px]:h-[407px] max-[360px]:w-[236px] max-[360px]:overflow-hidden">
        {/* Phone frame — the one sanctioned shadow (a floating product shot). The
            in-phone screens are decorative, so the whole viewport is aria-hidden. */}
        <div className="relative w-72 origin-top-left rounded-[38px] bg-ink p-3 shadow-[0_24px_60px_rgba(31,46,42,0.18)] max-[360px]:scale-[0.82]">
          <div className="relative h-[472px] w-[264px] overflow-hidden rounded-[27px] bg-paper" aria-hidden>
            {/* Status bar */}
            <div className="absolute inset-x-0 top-0 z-[2] flex h-[30px] items-center justify-between px-5 pt-2 font-mono text-[10px] text-ink-70">
              <span>9:41</span>
              <span className="relative inline-block h-[9px] w-[18px] rounded-[2px] border border-ink-50">
                <span className="absolute inset-[1.5px] right-1.5 rounded-[1px] bg-ink-70" />
              </span>
            </div>

            {/* Crossfade slides */}
            {SCREENS.map((s, idx) => (
              <div
                key={s.label}
                className={cn(
                  'absolute inset-x-0 bottom-0 top-[30px] transition-[opacity,transform] duration-page ease-standard motion-reduce:transition-none',
                  idx === i ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1.5 opacity-0',
                )}
              >
                {s.render({ active: idx === i, phase: idx === i ? phase : 'idle' })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Caption — no aria-live (autoplay would spam SRs); the labeled dots below
          announce position when the user navigates. min-height avoids reflow. */}
      <p className="mt-5 min-h-[40px] max-w-[300px] text-center font-sans text-small leading-[1.4] text-ink-70">
        <span className="mr-2 font-mono text-[12px] text-ink-50">
          {i + 1}/{N}
        </span>
        {SCREENS[i].caption}
      </p>

      {/* Controls */}
      <div className="mt-3.5 flex items-center gap-3.5">
        <button onClick={() => go(i - 1)} aria-label="Previous step" className={iconBtn}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Walkthrough steps">
          {SCREENS.map((s, idx) => (
            <button
              key={s.label}
              role="tab"
              aria-selected={idx === i}
              aria-label={`Go to step ${idx + 1}: ${s.label}`}
              onClick={() => go(idx)}
              className={cn(
                'h-2 rounded-pill transition-[background-color,width] duration-component ease-standard focus-visible:shadow-focus focus-visible:outline-none',
                idx === i ? 'w-[22px] bg-signal' : 'w-2 bg-ink-20',
              )}
            />
          ))}
        </div>

        <button onClick={() => go(i + 1)} aria-label="Next step" className={iconBtn}>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>

        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'}
          aria-pressed={playing}
          className={iconBtn}
        >
          {playing && !reduce ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </div>
    </div>
  )
}
