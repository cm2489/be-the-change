import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const FEATURES = [
  {
    title: 'Issues you actually care about',
    description: 'Tell us what matters to you — climate, healthcare, housing, democracy — and we surface the legislation that affects it.',
  },
  {
    title: 'One tap to call your rep',
    description: 'We find your representatives at every level: federal, state, and local. Tap to dial — no searching, no hold music maze.',
  },
  {
    title: 'AI script, ready to go',
    description: 'Calling your senator feels intimidating. We generate a natural, respectful script so you know exactly what to say.',
  },
  {
    title: 'Callenge your community',
    description: 'Commit to a number of calls with friends, family, or neighbors. Collective action is more powerful than going it alone.',
  },
  {
    title: 'Local matters too',
    description: 'City councils, mayors, school boards — the decisions closest to home often have the most impact on your daily life.',
  },
  {
    title: 'Privacy first, always',
    description: 'No ads. No data selling. No tracking. Your political beliefs stay yours. We are funded by people, not corporations.',
  },
]

const STEPS = [
  { number: '1', title: 'Tell us what matters', description: 'A quick 2-minute quiz maps your values and concerns. Update anytime.' },
  { number: '2', title: 'See what\'s happening', description: 'Your feed shows legislation coming up for a vote, filtered by your interests and location.' },
  { number: '3', title: 'Make the call', description: 'Get your AI-generated script, tap to call, and log your action. Five minutes can change policy.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18 }} className="text-ink">
          Be The Change
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            <span className="btn-label">Get started free</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-5 pt-12 pb-16 max-w-lg mx-auto">
        <Badge variant="outline" className="mb-5">Non-partisan · Free</Badge>

        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(40px, 8vw, 52px)', lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 400 }} className="text-ink mb-4">
          Your voice<br />matters.<br />
          <em style={{ color: '#E65A2B' }}>Make it heard.</em>
        </h1>

        <p className="t-body text-fg-2 mb-7 max-w-sm">
          Contact your representatives about the issues you care about. AI-generated scripts, one-tap calling, legislation matched to your values.
        </p>

        {/* Stat grid */}
        <Card className="mb-6 grid grid-cols-3 gap-3 p-4">
          {[
            { value: '50', label: 'States' },
            { value: '3', label: 'Levels' },
            { value: '<5', label: 'Min to act', mono: true },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, lineHeight: 1 }} className="text-ink">
                {s.value}
              </div>
              <div className="t-meta text-fg-3 mt-1">{s.label}</div>
            </div>
          ))}
        </Card>

        <Link href="/signup" className="btn btn-primary btn-xl w-full mb-2.5" style={{ borderRadius: 14 }}>
          <span className="btn-label">Get started — free</span>
        </Link>
        <Link href="/login" className="btn btn-ghost w-full">
          I already have an account
        </Link>
        <p className="t-meta text-fg-3 text-center mt-4">No ads · No data selling · Open to all US residents</p>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 bg-card border-y border-divider">
        <div className="max-w-2xl mx-auto">
          <h2 className="t-h1 text-ink mb-10 text-center">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number}>
                <div
                  className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center mb-4 t-meta"
                >
                  {i + 1}
                </div>
                <h3 className="t-h3 text-ink mb-1.5">{step.title}</h3>
                <p className="t-small text-fg-2 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <h2 className="t-h1 text-ink mb-10 text-center">Everything you need to act</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <Card key={f.title} interactive>
              <h3 className="t-h3 text-ink mb-1.5">{f.title}</h3>
              <p className="t-small text-fg-2 leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16 bg-ink text-paper text-center">
        <div className="max-w-sm mx-auto">
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, lineHeight: 1.15, fontWeight: 400, letterSpacing: '-0.01em' }} className="mb-4">
            Ready to be the change?
          </h2>
          <p className="t-body mb-8" style={{ color: 'rgba(247,244,238,0.7)' }}>
            Your call takes five minutes and it actually works. Representatives count constituent contacts.
          </p>
          <Link href="/signup" className="btn btn-action btn-lg w-full" style={{ maxWidth: 300, margin: '0 auto' }}>
            Create your free account
          </Link>
          <p className="t-meta mt-4" style={{ color: 'rgba(247,244,238,0.5)' }}>For all US residents. Not just citizens.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider px-5 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div style={{ fontFamily: "'Instrument Serif', serif" }} className="text-ink text-lg">Be The Change</div>
          <div className="t-small text-fg-3">Not political. Just powerful.</div>
          <div className="flex gap-5 t-small text-fg-2">
            <span className="cursor-pointer hover:text-ink">Privacy</span>
            <span className="cursor-pointer hover:text-ink">Terms</span>
            <span className="cursor-pointer hover:text-ink">Contact</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
