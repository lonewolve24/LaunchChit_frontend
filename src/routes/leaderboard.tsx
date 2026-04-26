import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { SkeletonCard } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/leaderboard')({
  validateSearch: (s: Record<string, unknown>) => ({
    period: (s.period as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined) ?? undefined,
    date: (s.date as string | undefined) ?? undefined,
    filter: (s.filter as 'featured' | 'all' | undefined) ?? undefined,
  }),
  component: LeaderboardPage,
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'
type Filter = 'featured' | 'all'

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: { name: string }
  topics?: Array<{ slug: string; name: string }>
  comments_count?: number
  waitlist_count?: number
  created_at?: string
}

const PLACEHOLDER_COLORS = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309', '#065F46']
function placeholderColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PLACEHOLDER_COLORS.length
  return PLACEHOLDER_COLORS[idx]
}

function toDateString(d: Date) { return d.toISOString().slice(0, 10) }
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function LeaderboardPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/leaderboard' })

  const period: Period = search.period ?? 'daily'
  const filter: Filter = search.filter ?? 'all'
  const date = search.date ?? toDateString(new Date())

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ period, date, filter })
    fetch(`${API}/products/leaderboard?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { setProducts(data.items); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period, date, filter])

  function update(next: Partial<{ period: Period; date: string; filter: Filter }>) {
    navigate({ to: '/leaderboard', search: { period, date, filter, ...next } })
  }

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
      setToast({ message: 'Could not register vote.', variant: 'error' })
    }
  }

  function handleWaitlist(id: string) {
    setProducts((prev) => prev.map((p) =>
      p.id === id ? { ...p, waitlist_count: (p.waitlist_count ?? 0) + 1 } : p
    ))
    setToast({ message: 'You\'re on the waitlist.', variant: 'success' })
  }

  const target = new Date(date + 'T12:00:00')
  const day = target.getDate()
  const month = target.getMonth()
  const year = target.getFullYear()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toDateString(new Date())

  // Pretty date for header
  const headerDate = target.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const headerLabel =
    period === 'daily' ? headerDate :
    period === 'weekly' ? `Week of ${headerDate}` :
    period === 'monthly' ? `${MONTH_NAMES[month]} ${year}` :
    `${year}`

  // Sidebar archive: years and current-year months
  const currentYear = new Date().getFullYear()
  const archiveYears = Array.from({ length: 6 }, (_, i) => currentYear - i)
  const monthsInYear = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAIN */}
          <div className="flex-1 min-w-0">

            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-9 h-9 rounded-card flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ backgroundColor: '#1B4332' }}
              >
                L
              </div>
              <h1 className="text-2xl md:text-[28px] font-bold text-foreground">
                Best of LaunchedChit
              </h1>
              <span className="text-foreground-faint text-xl hidden sm:inline">|</span>
              <span className="text-foreground-muted text-base hidden sm:inline">{headerLabel}</span>
            </div>

            {/* Tab + filter row */}
            <div className="flex items-center justify-between border-b border-border mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-1">
                {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => update({ period: p, date: todayStr })}
                    className={`px-1 pb-3 text-sm font-semibold capitalize border-b-2 -mb-[1px] transition-colors ${
                      period === p ? 'border-accent text-accent' : 'border-transparent text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 pb-2">
                {(['featured', 'all'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => update({ filter: f })}
                    className={`text-sm font-semibold capitalize px-3 py-1 rounded-button transition-colors ${
                      filter === f ? 'text-accent' : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Day strip pager (only shown on daily) */}
            {period === 'daily' && (
              <div className="bg-surface rounded-card px-3 py-2.5 mb-4 flex items-center gap-1 overflow-x-auto" style={{ boxShadow: cardShadow }}>
                <button
                  onClick={() => {
                    const d = new Date(target); d.setDate(d.getDate() - 1)
                    update({ date: toDateString(d) })
                  }}
                  className="text-foreground-muted hover:text-foreground px-2 text-lg flex-shrink-0"
                  aria-label="Previous day"
                >
                  ←
                </button>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const candidateDate = toDateString(new Date(year, month, d))
                  const isFuture = candidateDate > todayStr
                  const isActive = d === day
                  return (
                    <button
                      key={d}
                      disabled={isFuture}
                      onClick={() => update({ date: candidateDate })}
                      className={`text-sm w-8 h-8 flex items-center justify-center rounded-button transition-colors flex-shrink-0 ${
                        isActive
                          ? 'bg-accent/10 text-accent font-bold'
                          : isFuture
                            ? 'text-foreground-faint opacity-40 cursor-not-allowed'
                            : 'text-foreground-muted hover:bg-surface-subtle'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
                <button
                  onClick={() => {
                    const d = new Date(target); d.setDate(d.getDate() + 1)
                    const next = toDateString(d)
                    if (next <= todayStr) update({ date: next })
                  }}
                  disabled={date >= todayStr}
                  className="text-foreground-muted hover:text-foreground px-2 text-lg flex-shrink-0 disabled:opacity-40"
                  aria-label="Next day"
                >
                  →
                </button>
              </div>
            )}

            {/* List */}
            {loading ? (
              <SkeletonCard count={5} />
            ) : products.length === 0 ? (
              <EmptyState
                heading="No launches in this period"
                body="Try a different date or switch the time period."
                cta={{ label: 'Submit your product', onClick: () => { window.location.href = '/submit' } }}
              />
            ) : (
              <div className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: cardShadow }}>
                {products.map((product, i) => (
                  <a
                    key={product.id}
                    href={`/p/${product.slug}`}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-subtle transition-colors ${
                      i !== 0 ? 'border-t border-border' : ''
                    }`}
                  >
                    {/* Logo */}
                    {product.logo_url ? (
                      <img src={product.logo_url} alt={product.name} className="w-11 h-11 rounded-card object-cover flex-shrink-0" />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                        style={{ backgroundColor: placeholderColor(product.name) }}
                      >
                        {product.name[0]}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-[15px] truncate">
                        <span className="text-foreground-muted font-bold mr-1.5">{i + 1}.</span>
                        {product.name}
                      </p>
                      <p className="text-sm text-foreground-muted truncate">{product.tagline}</p>
                      {product.topics && product.topics.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-foreground-faint flex-wrap">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                          {product.topics.map((t, idx) => (
                            <span key={t.slug} className="flex items-center gap-1">
                              <span className="hover:text-foreground-muted">{t.name}</span>
                              {idx < product.topics!.length - 1 && <span>·</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats: comments + waitlist + upvote */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="flex flex-col items-center justify-center min-w-[52px] h-12 px-2 text-xs font-semibold text-foreground-muted border border-border rounded-button bg-surface"
                        title={`${product.comments_count ?? 0} comments`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="mt-0.5">{product.comments_count ?? 0}</span>
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); handleWaitlist(product.id) }}
                        className="flex flex-col items-center justify-center min-w-[52px] h-12 px-2 text-xs font-semibold text-foreground-muted border border-border rounded-button bg-surface hover:text-accent hover:border-accent transition-colors"
                        title={`${product.waitlist_count ?? 0} on waitlist · join waitlist`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M19 8v6" />
                          <path d="M22 11h-6" />
                        </svg>
                        <span className="mt-0.5">{product.waitlist_count ?? 0}</span>
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleVote(product.id) }}
                        aria-pressed={product.has_voted}
                        aria-label="Upvote"
                        className={`flex flex-col items-center justify-center min-w-[52px] h-12 px-2 text-xs font-bold border-2 rounded-button transition-colors ${
                          product.has_voted
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-foreground-muted bg-surface hover:border-accent hover:text-accent'
                        }`}
                      >
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden>
                          <path d="M5.5 0L11 9H0L5.5 0Z" />
                        </svg>
                        <span className="mt-0.5">{product.vote_count}</span>
                      </button>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR — Launch Archive */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-surface rounded-card p-5 sticky top-20" style={{ boxShadow: cardShadow }}>
              <p className="text-base font-bold text-foreground mb-4">Launch Archive</p>

              {archiveYears.map((y) => {
                const isCurrent = y === year && period !== 'yearly' ? false : y === year
                const isExpanded = y === year
                return (
                  <div key={y} className="mb-1">
                    <button
                      onClick={() => update({ period: 'yearly', date: `${y}-01-01` })}
                      className={`w-full text-left text-sm font-semibold py-1.5 px-2 rounded-button transition-colors ${
                        isCurrent ? 'text-foreground' : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                      }`}
                    >
                      {y}
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 space-y-0.5">
                        {monthsInYear.map((m) => {
                          const candidateDate = toDateString(new Date(y, m, 1))
                          const monthDateStr = `${y}-${String(m + 1).padStart(2, '0')}-01`
                          const isFutureMonth = candidateDate > todayStr
                          const isActiveMonth = m === month && y === year && (period === 'monthly' || period === 'daily')
                          return (
                            <li key={m}>
                              <button
                                disabled={isFutureMonth}
                                onClick={() => update({ period: 'monthly', date: monthDateStr })}
                                className={`w-full text-left flex items-center gap-2 text-sm py-1 px-2 rounded-button transition-colors ${
                                  isActiveMonth
                                    ? 'text-accent bg-accent/10 font-semibold'
                                    : isFutureMonth
                                      ? 'text-foreground-faint opacity-40 cursor-not-allowed'
                                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                                }`}
                              >
                                <span className="text-foreground-faint">·</span>
                                {MONTH_NAMES[m]}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
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
