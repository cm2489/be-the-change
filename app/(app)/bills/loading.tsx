import { PageHeader } from '@/components/ui/page-header'
import { BillCardSkeleton } from '@/components/ui/skeleton'

// Suspense fallback for the server-rendered feed — mirrors the /bills layout so
// nothing pops in. The title is static; the feed cards are skeletons.
export default function BillsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title="Issues" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <BillCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
