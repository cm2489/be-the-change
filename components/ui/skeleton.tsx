import { cn } from '@/lib/utils'

/**
 * A single pulsing placeholder block (neutral `ink-10`), the shared loading-state
 * primitive promoted from the bill-detail skeleton. Compose into layout-shaped
 * skeletons that hold each screen's real shape so content doesn't pop / shift in.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-ink-10', className)} aria-hidden />
}

/** Loading placeholder mirroring the decode-is-the-card V4 feed card. */
export function BillCardSkeleton() {
  return (
    <div className="block rounded-xl" aria-hidden>
      {/* source line on the paper */}
      <Skeleton className="mx-1 mb-2.5 h-3 w-3/4" />
      {/* the white "Decoded" answer card */}
      <div className="rounded-xl border border-divider bg-card p-5">
        <Skeleton className="mb-2 h-3 w-16" />
        <Skeleton className="mb-2 h-5 w-5/6" />
        <Skeleton className="mb-1 h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-4 h-5 w-20 rounded-pill" />
        <div className="mt-4 flex items-center justify-between border-t border-divider pt-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

/** Loading placeholder mirroring RepCard. */
export function RepCardSkeleton() {
  return (
    <div className="rounded-xl border border-divider bg-paper-mid p-4" aria-hidden>
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}
