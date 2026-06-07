import Link from 'next/link'
import type { Metadata } from 'next'
import { OravanWordmark } from '@/components/brand/OravanWordmark'

export const metadata: Metadata = {
  title: 'Terms — Oravan',
  description: 'The terms for using Oravan.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" aria-label="Oravan home">
          <OravanWordmark className="h-7 text-ink" />
        </Link>
        <Link href="/" className="text-small text-ink-70 hover:text-ink">
          &larr; Back home
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-h1 text-ink mb-3">Terms</h1>
        <p className="text-small text-ink-50 mb-10">
          Interim summary &mdash; the full Terms of Service are being finalized before public launch.
        </p>

        <div className="space-y-6 text-body text-ink-85 leading-relaxed">
          <p>
            Oravan is a free, non-partisan civic-engagement tool for people in the United
            States. We help you find your federal representatives, understand the bills in
            front of Congress, and contact your representatives by phone.
          </p>
          <p>
            AI-drafted call scripts are a starting point, not a finished statement. You review
            and edit every script before you use it, and you are responsible for what you say.
            We connect you to publicly available representative contact information; we do not
            place calls on your behalf.
          </p>
          <p>
            Please use Oravan lawfully and respectfully. We may update these terms as the
            product develops; we will post any material changes here before they take effect.
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
