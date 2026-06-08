import { BillCardSkeleton, Skeleton } from '@/components/ui/skeleton'

// Suspense fallback for the collapsed dashboard (greeting + decode-led feed).
// The greeting carries a name, so it's a skeleton too.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <BillCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
