import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MakerProductCard, type MakerProduct } from '../../maker/MakerProductCard'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = '' | 'live' | 'draft' | 'in-review' | 'removed'

export const Route = createFileRoute('/dashboard/products')({
  component: ProductsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['live', 'draft', 'in-review', 'removed'].includes(String(s.status)) ? s.status : '') as Status,
    page: typeof s.page === 'number' && s.page > 0 ? s.page : 1,
  }),
})

const FILTERS: Array<{ value: Status; label: string }> = [
  { value: '',          label: 'All' },
  { value: 'live',      label: 'Live' },
  { value: 'in-review', label: 'In review' },
  { value: 'draft',     label: 'Drafts' },
  { value: 'removed',   label: 'Removed' },
]

function ProductsPage() {
  const { status, page } = Route.useSearch()
  const [items, setItems] = useState<MakerProduct[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('page_size', '12')
    if (status) params.set('status', status)
    fetch(`${API}/me/products?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (!data) { setItems([]); setTotal(0); setLoading(false); return }
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setItems([]); setLoading(false) } })
    return () => { cancelled = true }
  }, [status, page])

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My products</h1>
          <p className="text-foreground-muted mt-1">{total} {total === 1 ? 'product' : 'products'} total.</p>
        </div>
        <Link
          to="/submit"
          className="bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-button hover:bg-accent-dark transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New launch
        </Link>
      </header>

      {/* Status filter */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto -mx-1 px-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value || 'all'}
            to="/dashboard/products"
            search={{ status: f.value, page: 1 }}
            className={`text-sm font-semibold px-3 py-2 -mb-px border-b-2 transition-colors whitespace-nowrap ${
              status === f.value
                ? 'text-primary border-primary'
                : 'text-foreground-muted border-transparent hover:text-foreground'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-card" />)}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          heading="No products yet"
          body="You haven't launched anything in this view. Submit your first product to get started."
          cta={{ label: 'Submit a product', onClick: () => { window.location.href = '/submit' } }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((p) => (
            <MakerProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
