import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Single-interest nudge, docked at the bottom: above the mobile bottom tab bar
// (bottom-14), flush on desktop (no bottom bar). paper-dark surface, ink CTA.
export function AddInterestsBar() {
  return (
    <div className="fixed inset-x-0 bottom-14 z-40 border-t border-divider bg-paper-dark lg:bottom-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <p className="text-small text-ink-70">
          <span className="font-medium text-ink">Add more interests</span> · See more bills you can
          act on.
        </p>
        <Link href="/onboarding">
          <Button size="sm">Add</Button>
        </Link>
      </div>
    </div>
  )
}
