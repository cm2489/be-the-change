import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
        <div className="text-xl font-bold text-civic-600">Be The Change</div>
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
        <div className="inline-flex items-center gap-2 bg-civic-50 text-civic-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-civic-200">
          <span>🗳️</span>
          <span>Pro-democracy. Non-partisan. Built for everyone.</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6 text-balance">
          Your voice matters.
          <br />
          <span className="text-civic-600">Make it heard.</span>
        </h1>

        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto text-balance">
          Be The Change makes it effortless to contact your representatives about the issues you
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
      <section className="bg-slate-50 border-y border-slate-200 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-civic-600">100%</div>
            <div className="text-sm text-slate-500 mt-1">Free to use</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-300" />
          <div>
            <div className="text-3xl font-bold text-civic-600">3 levels</div>
            <div className="text-sm text-slate-500 mt-1">Federal, state & local reps</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-300" />
          <div>
            <div className="text-3xl font-bold text-civic-600">50 states</div>
            <div className="text-sm text-slate-500 mt-1">Full state legislation coverage</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-300" />
          <div>
            <div className="text-3xl font-bold text-civic-600">&lt; 5 min</div>
            <div className="text-sm text-slate-500 mt-1">To make a difference</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
          <p className="text-slate-500 mt-3">From signup to your first call in under 5 minutes.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map(step => (
            <div key={step.number} className="relative">
              <div className="w-10 h-10 rounded-full bg-civic-600 text-white font-bold text-lg flex items-center justify-center mb-4">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">
              Everything you need to be civically active
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 mb-4 text-balance">
          Ready to be the change?
        </h2>
        <p className="text-lg text-slate-500 mb-10 text-balance">
          Join thousands of everyday Americans making their voices heard. Your call takes 2
          minutes — and it actually works.
        </p>
        <Link href="/signup">
          <Button size="lg">
            Create your free account
          </Button>
        </Link>
        <p className="mt-4 text-sm text-slate-400">For all US residents. Not just citizens.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="font-semibold text-civic-600">Be The Change</div>
          <div>Not political. Just powerful. 🇺🇸</div>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-slate-600">Privacy</span>
            <span className="cursor-pointer hover:text-slate-600">Terms</span>
            <span className="cursor-pointer hover:text-slate-600">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
