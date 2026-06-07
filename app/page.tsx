import Link from 'next/link'
import {
  Target,
  Landmark,
  MessageSquareText,
  Activity,
  Lock,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OravanWordmark } from '@/components/brand/OravanWordmark'
import { createServerClient } from '@/lib/supabase/server'

type Feature = {
  Icon: LucideIcon
  title: string
  description: string
  tag?: string
}

const FEATURES: Feature[] = [
  {
    Icon: Target,
    title: 'Issues you actually care about',
    description:
      'Tell us what matters to you (climate, healthcare, housing, democracy) and we surface the federal bills that affect it.',
  },
  {
    Icon: Landmark,
    title: 'Your representatives, found for you',
    description:
      'Enter your address and we find your House representative and your two Senators. No lookup, no guesswork.',
  },
  {
    Icon: MessageSquareText,
    title: 'AI script, ready to go',
    description:
      'Calling your senator feels intimidating. We draft a natural, respectful script so you know what to say, always yours to review and edit first.',
  },
  {
    Icon: Activity,
    title: 'Track your impact',
    description:
      'See every call you have made and every script you have drafted. Your civic footprint, in one place.',
  },
  {
    Icon: Lock,
    title: 'Independent, funded by people',
    description:
      'No advertisers and no data brokers. Oravan is funded by the people who use it, never by selling what you believe.',
  },
  {
    Icon: MapPin,
    title: 'State and local coverage',
    description:
      'Today Oravan covers Congress. Your state legislature and local officials are next.',
    tag: 'On the roadmap',
  },
]

const STEPS = [
  {
    number: '1',
    title: 'Tell us what matters to you',
    description:
      'A quick 2-minute quiz maps your values and concerns. You can always update this anytime.',
  },
  {
    number: '2',
    title: 'See what\'s happening',
    description:
      'Your personalized feed shows federal legislation coming up for a vote, filtered by your issue priorities and drawn directly from Congress.gov.',
  },
  {
    number: '3',
    title: 'Make the call',
    description:
      'Get your AI-drafted script, tap to call, and log your action. Five minutes of your day can change policy.',
  },
]

export default async function LandingPage() {
  // Public marketing page. A logged-in visitor is sent to their dashboard so
  // they never see the anonymous "Get started free" nav. Fail open: an auth
  // hiccup must never break the public landing — fall through to the marketing
  // render. (redirect() throws internally, so it stays OUTSIDE the try/catch.)
  let hasSession = false
  try {
    const supabase = await createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    hasSession = !!session
  } catch {
    hasSession = false
  }
  if (hasSession) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <OravanWordmark className="h-6 text-ink" />
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 text-center max-w-4xl mx-auto">
        <p className="text-meta uppercase text-ink-50 mb-6">Pro-democracy &middot; Non-partisan</p>

        <h1 className="font-serif text-h1 sm:text-display text-ink leading-tight mb-6 text-balance">
          Your voice matters.
          <br />
          Make it heard.
        </h1>

        <p className="text-h3 text-ink-70 mb-10 max-w-2xl mx-auto text-balance leading-relaxed">
          Oravan makes it effortless to contact your federal representatives about the issues
          you care about: AI-drafted scripts, one-tap calling, and legislation matched to your
          values.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Start making calls, it&apos;s free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>

        <p className="mt-5 text-small text-ink-50">
          No ads. No data selling. No tracking.
        </p>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-serif text-h2 text-ink">How it works</h2>
          <p className="text-body text-ink-70 mt-3">
            From signup to your first call in under 5 minutes.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map(step => (
            <div key={step.number} className="relative">
              <div className="w-10 h-10 rounded-full bg-ink text-paper font-bold text-h3 flex items-center justify-center mb-4">
                {step.number}
              </div>
              <h3 className="text-h3 font-semibold text-ink mb-2">{step.title}</h3>
              <p className="text-ink-70 text-small leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What Oravan does — card-less editorial list (no boxes/shadows) */}
      <section className="px-6 py-20 bg-paper-dark border-y border-divider">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-h2 text-ink mb-12">What Oravan does</h2>

          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-9">
            {FEATURES.map(feature => (
              <div key={feature.title} className="border-t border-divider pt-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <feature.Icon className="w-4 h-4 text-ink-50" strokeWidth={1.5} aria-hidden />
                  <h3 className="text-body font-semibold text-ink">{feature.title}</h3>
                  {feature.tag && (
                    <span className="ml-auto text-meta uppercase text-ink-50">{feature.tag}</span>
                  )}
                </div>
                <p className="text-small text-ink-70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <h2 className="font-serif text-h1 text-ink mb-4 text-balance">
          Ready to make your voice heard?
        </h2>
        <p className="text-h3 text-ink-70 mb-10 text-balance leading-relaxed">
          Five minutes is all it takes to tell your representatives where you stand. Free, for
          everyone in the US.
        </p>
        <Link href="/signup">
          <Button size="lg">Create your free account</Button>
        </Link>
        <p className="mt-4 text-small text-ink-50">For all US residents. Not just citizens.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-small text-ink-50">
          <OravanWordmark className="h-7 text-ink" />
          <div className="text-meta uppercase text-ink-50">Nonpartisan, by design</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink-70">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink-70">
              Terms
            </Link>
            <a href="mailto:hello@oravan.org" className="hover:text-ink-70">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
