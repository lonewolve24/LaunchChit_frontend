type SkeletonProps = { className?: string }

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded bg-surface-raised ${className}`} />
  )
}

type SkeletonCardProps = { count?: number }

export function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          role="presentation"
          className="bg-surface border border-border rounded-card px-4 py-3 flex gap-4 items-start"
        >
          <Skeleton className="w-10 h-16 flex-shrink-0" />
          <div className="flex gap-3 items-start flex-1">
            <Skeleton className="w-12 h-12 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
