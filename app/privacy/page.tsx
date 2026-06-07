import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy — Oravan',
  description: 'How Oravan handles your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold text-ink">
          Oravan
        </Link>
        <Link href="/" className="text-small text-ink-70 hover:text-ink">
          &larr; Back home
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-h1 text-ink mb-3">Privacy</h1>
        <p className="text-small text-ink-50 mb-10">
          Interim summary &mdash; the full Privacy Policy is being finalized before public launch.
        </p>

        <div className="space-y-6 text-body text-ink-85 leading-relaxed">
          <p>
            Oravan helps you contact your federal representatives. We collect only what that
            requires: your name, email, ZIP or address (to find your representatives and
            district), and the issues and values you choose during onboarding.
          </p>
          <p>
            <strong className="font-semibold text-ink">We never sell or share your data.</strong>{' '}
            We run no ads and use no third-party trackers. Your political profile &mdash; your
            values, issue priorities, and who you contact &mdash; stays yours. Access is enforced
            per account at the database level, so other users can never see your information.
          </p>
          <p>
            Bill information comes from the official{' '}
            <a
              href="https://www.congress.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-ink"
            >
              Congress.gov
            </a>{' '}
            API. The calls and scripts you log are visible only to you, on your activity page.
          </p>
          <p>
            Questions? Email{' '}
            <a href="mailto:hello@oravan.org" className="underline hover:text-ink">
              hello@oravan.org
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
