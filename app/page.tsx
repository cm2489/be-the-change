import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const FEATURES = [
  {
    icon: '📋',
    title: 'Issues you actually care about',
    description:
      'Tell us what matters to you — climate, healthcare, housing, democracy — and we surface the legislation that affects it.',
  },
  {
    icon: '📞',
    title: 'One tap to call your rep',
    description:
      'We find your representatives at every level: federal, state, and local. Tap to dial — no searching, no hold music maze.',
  },
  {
    icon: '✍️',
    title: 'AI script, ready to go',
    description:
      'Calling your senator feels intimidating. We generate a natural, respectful script so you know exactly what to say.',
  },
  {
    icon: '🏆',
    title: 'Callenge your community',
    description:
      'Commit to a number of calls with friends, family, or neighbors. Collective action is more powerful than going it alone.',
  },
  {
    icon: '📍',
    title: 'Local matters too',
    description:
      'City councils, mayors, school boards — the decisions closest to home often have the most impact on your daily life.',
  },
  {
    icon: '🔒',
    title: 'Privacy first, always',
    description:
      'No ads. No data selling. No tracking. Your political beliefs stay yours. We are funded by people, not corporations.',
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
      'Your personalized feed shows legislation coming up for a vote — filtered by your interests and your location.',
  },
  {
    number: '3',
    title: 'Make the call',
    description:
      'Get your AI-generated script, tap to call, and log your action. Five minutes of your day can change policy.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-xl font-bold text-ink">Oravan</div>
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
        <div className="inline-flex items-center gap-2 bg-ink-10 text-ink text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-ink-20">
          <span>🗳️</span>
          <span>Pro-democracy. Non-partisan. Built for everyone.</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6 text-balance">
          Your voice matters.
          <br />
          <span className="text-ink">Make it heard.</span>
        </h1>

        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto text-balance">
          Oravan makes it effortless to contact your representatives about the issues you
          care about — with AI-generated scripts, one-tap calling, and legislation matched to
          your values.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Start making calls — it&apos;s free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>

        <p className="mt-5 text-sm text-slate-400">
          No credit card. No ads. No data selling. Free for everyone in the US.
        </p>
      </section>

      {/* Social proof strip */}
      <section className="bg-paper border-y border-divider py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-ink">100%</div>
            <div className="text-small text-ink-70 mt-1">Free to use</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-divider-strong" />
          <div>
            <div className="text-3xl font-bold text-ink">1-click</div>
            <div className="text-small text-ink-70 mt-1">Calling your reps</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-divider-strong" />
          <div>
            <div className="text-3xl font-bold text-ink">&lt; 5 min</div>
            <div className="text-small text-ink-70 mt-1">To make a difference</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-ink">How it works</h2>
          <p className="text-ink-70 mt-3">From signup to your first call in under 5 minutes.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map(step => (
            <div key={step.number} className="relative">
              <div className="w-10 h-10 rounded-full bg-ink text-white font-bold text-h3 flex items-center justify-center mb-4">
                {step.number}
              </div>
              <h3 className="text-h3 font-semibold text-ink mb-2">{step.title}</h3>
              <p className="text-ink-70 text-small leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-20 bg-paper border-y border-divider">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-ink">
              Everything you need to be civically active
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => (
              <Card
                key={feature.title}
                padding="md"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-body font-semibold text-ink mb-2">
                  {feature.title}
                </h3>
                <p className="text-small text-ink-70 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <h2 className="text-h1 font-bold text-ink mb-4 text-balance">
          Ready to be the change?
        </h2>
        <p className="text-lg text-ink-70 mb-10 text-balance">
          Join thousands of everyday Americans making their voices heard. Your call takes 2
          minutes — and it actually works.
        </p>
        <Link href="/signup">
          <Button size="lg">
            Create your free account
          </Button>
        </Link>
        <p className="mt-4 text-small text-ink-50">For all US residents. Not just citizens.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-small text-ink-50">
          <div className="font-semibold text-ink">Oravan</div>
          <div>Not political. Just powerful. 🇺🇸</div>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-ink-70">Privacy</span>
            <span className="cursor-pointer hover:text-ink-70">Terms</span>
            <span className="cursor-pointer hover:text-ink-70">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
