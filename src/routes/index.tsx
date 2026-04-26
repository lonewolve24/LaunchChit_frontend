import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/')({ component: FeedPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: { name: string }
  created_at?: string
  comments_count?: number
  waitlist_count?: number
  topics?: Array<{ slug: string; name: string }>
}

type FeedResponse = { items: Product[]; total: number; page: number; page_size: number }

const PAGE_SIZES = [10, 25, 50, 100] as const

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function currentYearMonth(): { year: number; month: number } {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

export function FeedPage() {
  const now = currentYearMonth()
  const [year, setYear] = useState<number | 'all'>(now.year)
  const [month, setMonth] = useState<number | 'all'>(now.month)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (year !== 'all' && month !== 'all') {
      const m = String(month).padStart(2, '0')
      params.set('month', `${year}-${m}`)
    }
    params.set('page', String(page))
    params.set('page_size', String(pageSize))

    fetch(`${API}/products/today?${params.toString()}`)
      .then((r) => r.json())
      .then((data: FeedResponse) => {
        setProducts(data.items)
        setTotal(data.total)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [year, month, page, pageSize])

  // reset to page 1 when filter or page size changes
  useEffect(() => { setPage(1) }, [year, month, pageSize])

  async function handleVote(id: string) {
    const product = products.find((p) => p.id === id)
    if (!product) return
    const method = product.has_voted ? 'DELETE' : 'POST'
    const res = await fetch(`${API}/products/${id}/vote`, { method, credentials: 'include' })
    if (res.status === 401) { window.location.href = '/login'; return }
    if (res.ok) {
      const { vote_count } = await res.json()
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, vote_count, has_voted: !p.has_voted } : p))
    } else {
      setToast({ message: 'Could not register vote. Try again.', variant: 'error' })
    }
  }

  function handleWaitlist(id: string) {
    setProducts((prev) => prev.map((p) =>
      p.id === id ? { ...p, waitlist_count: (p.waitlist_count ?? 0) + 1 } : p
    ))
    setToast({ message: 'You\'re on the waitlist. The maker will reach out when it\'s ready.', variant: 'success' })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, total)

  // Build year options: this year and previous 2 years
  const years = [now.year, now.year - 1, now.year - 2]

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">Launches</h1>
            {year !== 'all' && month !== 'all' && (
              <span className="text-sm text-foreground-muted">{MONTHS[(month as number) - 1]} {year}</span>
            )}
          </div>

          {/* Month / Year selectors */}
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              aria-label="Filter by month"
              className="bg-surface border border-border rounded-button px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ boxShadow: cardShadow }}
            >
              <option value="all">All months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              aria-label="Filter by year"
              className="bg-surface border border-border rounded-button px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ boxShadow: cardShadow }}
            >
              <option value="all">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Feed */}
          <div className="flex-1 min-w-0 space-y-4">
            {loading ? (
              <SkeletonCard count={3} />
            ) : products.length === 0 ? (
              <EmptyState
                heading="No launches in this period"
                body="Try a different month, or be the first to ship."
                cta={{ label: 'Submit your product', onClick: () => { window.location.href = '/submit' } }}
              />
            ) : (
              <>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onVote={handleVote} onWaitlist={handleWaitlist} />
                ))}

                {/* Pagination */}
                <div className="bg-surface rounded-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6" style={{ boxShadow: cardShadow }}>
                  <div className="flex items-center gap-3 text-sm text-foreground-muted">
                    <span>
                      Showing <span className="font-semibold text-foreground">{showingFrom}–{showingTo}</span> of{' '}
                      <span className="font-semibold text-foreground">{total}</span>
                    </span>
                    <span className="text-foreground-faint">·</span>
                    <label className="flex items-center gap-2">
                      Show
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-surface border border-border rounded-button px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                      >
                        {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      per page
                    </label>
                  </div>

                  <Pager page={page} totalPages={totalPages} onChange={setPage} />
                </div>
              </>
            )}
          </div>

          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
            <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
              <p className="text-base font-bold text-foreground mb-2">What is LaunchedChit?</p>
              <p className="text-sm text-foreground-muted leading-relaxed">
                A daily feed of products built by Gambian makers. Ship something. Get seen.
              </p>
              <a
                href="/submit"
                className="mt-5 block text-center bg-accent text-white text-sm font-semibold px-4 py-3 rounded-button hover:bg-accent-dark transition-colors"
              >
                Submit your product
              </a>
            </div>

            <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
              <p className="text-base font-bold text-foreground mb-3">Popular Topics</p>
              <div className="space-y-1">
                {[
                  { label: 'Fintech', slug: 'fintech' },
                  { label: 'Agri-Tech', slug: 'agri-tech' },
                  { label: 'EdTech', slug: 'edtech' },
                  { label: 'HealthTech', slug: 'healthtech' },
                  { label: 'Logistics', slug: 'logistics' },
                  { label: 'E-commerce', slug: 'ecommerce' },
                ].map((t) => (
                  <a
                    key={t.slug}
                    href={`/topics/${t.slug}`}
                    className="flex items-center justify-between text-sm text-foreground-muted hover:text-foreground hover:bg-surface-subtle px-2 py-1.5 rounded-button transition-colors group"
                  >
                    <span>{t.label}</span>
                    <span className="text-foreground-faint group-hover:text-foreground-muted transition-colors">›</span>
                  </a>
                ))}
              </div>
              <a href="/topics" className="mt-3 block text-xs text-primary hover:underline font-medium">
                View all topics →
              </a>
            </div>
          </aside>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  // Build a compact page list: 1, ..., page-1, page, page+1, ..., totalPages
  const pages: Array<number | '…'> = []
  const push = (p: number | '…') => { if (pages[pages.length - 1] !== p) pages.push(p) }
  push(1)
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 1 && p < totalPages) {
      if (p > 2 && pages[pages.length - 1] !== p - 1) push('…')
      push(p)
    }
  }
  if (totalPages > 1) {
    if (pages[pages.length - 1] !== totalPages - 1 && totalPages > 2) push('…')
    push(totalPages)
  }

  const btn = 'w-8 h-8 text-sm font-medium rounded-button border transition-colors flex items-center justify-center'

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className={`${btn} bg-surface border-border text-foreground-muted hover:text-foreground hover:border-border-strong disabled:opacity-40`}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="text-foreground-faint px-1">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`${btn} ${p === page ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-foreground-muted hover:text-foreground hover:border-border-strong'}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className={`${btn} bg-surface border-border text-foreground-muted hover:text-foreground hover:border-border-strong disabled:opacity-40`}
      >
        ›
      </button>
    </div>
  )
}
