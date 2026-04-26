import { Skeleton } from './Skeleton'

/*
  Shown by the router when a route is still resolving and exceeds
  defaultPendingMs. Mimics the layout shape (header band + content
  skeleton) so the page does not feel blank.
*/
export function RoutePending() {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <div className="bg-primary h-16 w-full" aria-hidden style={{ boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.25)' }} />
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-4" role="status" aria-live="polite">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-32 w-full rounded-card" />
            <Skeleton className="h-32 w-full rounded-card" />
            <Skeleton className="h-32 w-full rounded-card" />
          </div>
          <aside className="space-y-3">
            <Skeleton className="h-40 w-full rounded-card" />
            <Skeleton className="h-40 w-full rounded-card" />
          </aside>
        </div>
        <span className="sr-only">Loading…</span>
      </main>
    </div>
  )
}
