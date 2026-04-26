import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { Skeleton } from '../components/Skeleton'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/community')({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (s.tab as 'forums' | 'events' | 'requests' | undefined) ?? undefined,
    category: (s.category as string | undefined) ?? undefined,
    product: (s.product as string | undefined) ?? undefined,
    sort: (s.sort as string | undefined) ?? undefined,
  }),
  component: CommunityPage,
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Tab = 'forums' | 'events' | 'requests'

type Category = { slug: string; name: string; description: string; icon_color: string; thread_count: number }
type ProductForum = { slug: string; name: string; thread_count: number; topics: Array<{ slug: string; name: string }> }
type Thread = {
  id: string
  category: string
  product_slug: string | null
  title: string
  body_preview: string
  author: { name: string }
  replies: number
  upvotes: number
  last_reply_at: string
  pinned: boolean
}
type Event = {
  id: string
  title: string
  date: string
  location: string
  mode: 'In person' | 'Online'
  host: string
  description: string
  attendees: number
  capacity: number
  color: string
}
type Request = {
  id: string
  title: string
  body: string
  requester: { name: string }
  upvotes: number
  responses: number
  status: 'open' | 'in-progress' | 'shipped'
  created_at: string
}

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

function avatarColor(name: string): string {
  const colors = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309']
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}

function formatEventDate(iso: string): { day: string; month: string; time: string; full: string } {
  const d = new Date(iso)
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export function CommunityPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/community' })
  const tab: Tab = search.tab ?? 'forums'

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Community</h1>
            <p className="text-foreground-muted mt-1 text-[15px]">Talk to other Gambian builders. Find events. Request what's missing.</p>
          </div>
          <button
            onClick={() => {
              if (tab === 'requests') navigate({ to: '/community', search: { tab: 'requests' } })
              else navigate({ to: '/community', search: { tab: 'forums' } })
            }}
            className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-button hover:bg-accent-dark transition-colors flex-shrink-0"
          >
            {tab === 'events' ? '+ Suggest an event' : tab === 'requests' ? '+ Submit a request' : '+ Start a thread'}
          </button>
        </div>

        {/* Top tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
          {(['forums', 'events', 'requests'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => navigate({ to: '/community', search: { tab: t } })}
              className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 -mb-[1px] transition-colors whitespace-nowrap ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              {t === 'forums' ? 'Forums' : t === 'events' ? 'Events' : 'Software Requests'}
            </button>
          ))}
        </div>

        {tab === 'forums' && <ForumsTab />}
        {tab === 'events' && <EventsTab />}
        {tab === 'requests' && <RequestsTab />}
      </main>
    </div>
  )
}

// ---------- FORUMS TAB ----------
function ForumsTab() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/community' })
  const activeCategory = search.category
  const activeProduct = search.product
  const sort = (search.sort as 'recent' | 'popular') ?? 'recent'

  const [categories, setCategories] = useState<Category[]>([])
  const [productForums, setProductForums] = useState<ProductForum[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/community/categories`).then((r) => r.json()),
      fetch(`${API}/community/product-forums`).then((r) => r.json()),
    ]).then(([cats, forums]) => {
      setCategories(cats)
      setProductForums(forums)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ sort })
    if (activeCategory) params.set('category', activeCategory)
    if (activeProduct) params.set('product', activeProduct)
    fetch(`${API}/community/threads?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { setThreads(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeCategory, activeProduct, sort])

  function setFilter(next: { category?: string; product?: string }) {
    navigate({ to: '/community', search: { tab: 'forums', ...next, sort } })
  }

  const totalThreads = threads.length
  const headerLabel =
    activeCategory ? categories.find((c) => c.slug === activeCategory)?.name ?? 'Forum' :
    activeProduct ? productForums.find((p) => p.slug === activeProduct)?.name ?? 'Forum' :
    'All threads'

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <aside className="lg:w-64 flex-shrink-0 space-y-5">
        <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">Categories</p>
          <div className="space-y-0.5">
            <button
              onClick={() => navigate({ to: '/community', search: { tab: 'forums', sort } })}
              className={`w-full text-left text-sm py-1.5 px-2 rounded-button transition-colors ${
                !activeCategory && !activeProduct
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
              }`}
            >
              All threads
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setFilter({ category: c.slug })}
                className={`w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-button transition-colors ${
                  activeCategory === c.slug
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.icon_color }} />
                  {c.name}
                </span>
                <span className="text-xs text-foreground-faint">{c.thread_count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">Product Forums</p>
          <div className="space-y-0.5">
            {productForums.length === 0 ? (
              <p className="text-xs text-foreground-faint">No product forums yet.</p>
            ) : (
              productForums.map((f) => (
                <button
                  key={f.slug}
                  onClick={() => setFilter({ product: f.slug })}
                  className={`w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-button transition-colors ${
                    activeProduct === f.slug
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                  }`}
                >
                  <span className="truncate">p/{f.slug.split('-').slice(0, 2).join('-')}</span>
                  <span className="text-xs text-foreground-faint">{f.thread_count}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-primary rounded-card p-5">
          <p className="text-sm font-bold text-white mb-1">Have something on your mind?</p>
          <p className="text-xs text-white/70 leading-relaxed">Start a thread and tag the right category. The community usually replies within a few hours.</p>
          <button
            onClick={() => alert('Sign in to start a thread.')}
            className="mt-3 w-full bg-accent text-white text-sm font-semibold py-2 rounded-button hover:bg-accent-dark transition-colors"
          >
            Start a thread
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{headerLabel}</h2>
            <p className="text-xs text-foreground-muted mt-0.5">{totalThreads} {totalThreads === 1 ? 'thread' : 'threads'}</p>
          </div>
          <div className="flex items-center gap-1 bg-surface rounded-button border border-border p-1" style={{ boxShadow: cardShadow }}>
            {(['recent', 'popular'] as const).map((s) => (
              <button
                key={s}
                onClick={() => navigate({ to: '/community', search: { ...search, tab: 'forums', sort: s } })}
                className={`text-xs font-semibold capitalize px-3 py-1 rounded-button transition-colors ${
                  sort === s ? 'bg-primary text-white' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: cardShadow }}>
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-16 w-full rounded-button" />
              <Skeleton className="h-16 w-full rounded-button" />
              <Skeleton className="h-16 w-full rounded-button" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-base font-bold text-foreground">No threads yet</p>
              <p className="text-sm text-foreground-muted mt-1">Be the first to start a conversation here.</p>
            </div>
          ) : (
            threads.map((t, i) => {
              const cat = categories.find((c) => c.slug === t.category)
              return (
                <a
                  key={t.id}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-surface-subtle transition-colors ${
                    i !== 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(t.author.name) }}
                  >
                    {t.author.name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {t.pinned && (
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          📌 Pinned
                        </span>
                      )}
                      {cat && (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: cat.icon_color }}
                        >
                          {cat.name}
                        </span>
                      )}
                      {t.product_slug && (
                        <>
                          <span className="text-foreground-faint text-xs">·</span>
                          <span className="text-[10px] font-semibold text-foreground-faint uppercase tracking-wider">
                            p/{t.product_slug.split('-').slice(0, 2).join('-')}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="font-semibold text-foreground text-[15px] leading-snug">{t.title}</p>
                    <p className="text-sm text-foreground-muted mt-0.5 line-clamp-1">{t.body_preview}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-foreground-faint">
                      <span>by <span className="font-medium text-foreground-muted">{t.author.name}</span></span>
                      <span>·</span>
                      <span>last reply {t.last_reply_at}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex flex-col items-center justify-center min-w-[50px] h-12 px-2 text-xs font-semibold text-foreground-muted border border-border rounded-button bg-surface" title={`${t.replies} replies`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="mt-0.5">{t.replies}</span>
                    </span>
                    <span className="flex flex-col items-center justify-center min-w-[50px] h-12 px-2 text-xs font-bold text-foreground-muted border-2 border-border rounded-button bg-surface" title={`${t.upvotes} upvotes`}>
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden>
                        <path d="M5.5 0L11 9H0L5.5 0Z" />
                      </svg>
                      <span className="mt-0.5">{t.upvotes}</span>
                    </span>
                  </div>
                </a>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- EVENTS TAB ----------
function EventsTab() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvped, setRsvped] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/community/events`)
      .then((r) => r.json())
      .then((data) => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggleRsvp(id: string) {
    const next = new Set(rsvped)
    if (next.has(id)) {
      next.delete(id)
      setToast({ message: 'RSVP cancelled.', variant: 'success' })
    } else {
      next.add(id)
      setToast({ message: 'RSVPed. We\'ll send a calendar invite.', variant: 'success' })
    }
    setRsvped(next)
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full rounded-card" /><Skeleton className="h-32 w-full rounded-card" /></div>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {events.map((e) => {
          const date = formatEventDate(e.date)
          const isRsvped = rsvped.has(e.id)
          const pct = (e.attendees / e.capacity) * 100
          return (
            <div key={e.id} className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: cardShadow }}>
              <div className="flex">
                <div
                  className="w-24 flex-shrink-0 flex flex-col items-center justify-center text-white py-5"
                  style={{ backgroundColor: e.color }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{date.month}</span>
                  <span className="text-3xl font-bold leading-none mt-1">{date.day}</span>
                  <span className="text-xs mt-2 opacity-80">{date.time}</span>
                </div>
                <div className="flex-1 p-5 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      e.mode === 'In person' ? 'text-primary bg-primary/10' : 'text-accent bg-accent/10'
                    }`}>
                      {e.mode}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-snug">{e.title}</h3>
                  <p className="text-xs text-foreground-muted mt-1">📍 {e.location}</p>
                  <p className="text-xs text-foreground-faint mt-0.5">Hosted by {e.host}</p>
                  <p className="text-sm text-foreground-muted mt-3 leading-relaxed line-clamp-2">{e.description}</p>

                  <div className="flex items-center justify-between gap-3 mt-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs text-foreground-muted mb-1">
                        <span>{e.attendees} attending</span>
                        <span>{e.capacity - e.attendees} spots left</span>
                      </div>
                      <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRsvp(e.id)}
                      className={`text-sm font-semibold px-4 py-2 rounded-button transition-colors flex-shrink-0 border ${
                        isRsvped
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-foreground border-border hover:border-border-strong'
                      }`}
                    >
                      {isRsvped ? '✓ Going' : 'RSVP'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-primary rounded-card p-6 text-center">
        <p className="text-base font-bold text-white">Hosting something?</p>
        <p className="text-sm text-white/70 mt-1 max-w-md mx-auto">
          Workshops, meetups, demos, hackathons — if it brings Gambian builders together, we'll feature it here.
        </p>
        <button className="mt-4 bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-button hover:bg-accent-dark transition-colors">
          Submit your event
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

// ---------- REQUESTS TAB ----------
function RequestsTab() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<'popular' | 'recent'>('popular')
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/community/requests?sort=${sort}`)
      .then((r) => r.json())
      .then((data) => { setRequests(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sort])

  async function upvote(id: string) {
    if (voted.has(id)) return
    const res = await fetch(`${API}/community/requests/${id}/upvote`, { method: 'POST' })
    if (res.ok) {
      const { upvotes } = await res.json()
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, upvotes } : r))
      setVoted((prev) => new Set(prev).add(id))
      setToast({ message: 'Upvoted — your interest signals to makers.', variant: 'success' })
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ boxShadow: cardShadow }}>
        <div className="max-w-2xl">
          <p className="text-base font-bold text-foreground">What software does The Gambia need?</p>
          <p className="text-sm text-foreground-muted mt-1 leading-relaxed">
            Upvote requests you'd use. Makers watch this list — popular requests get built. If you'd <em>pay</em> for it, even better.
          </p>
        </div>
        <button className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-button hover:bg-accent-dark transition-colors flex-shrink-0">
          + Submit a request
        </button>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-foreground-muted">Sort:</span>
        <div className="flex items-center gap-1 bg-surface rounded-button border border-border p-1" style={{ boxShadow: cardShadow }}>
          {(['popular', 'recent'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-xs font-semibold capitalize px-3 py-1 rounded-button transition-colors ${
                sort === s ? 'bg-primary text-white' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-card" />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const hasVoted = voted.has(r.id)
            const statusBadge = {
              open: { label: 'Open', cls: 'text-foreground-muted bg-surface-raised' },
              'in-progress': { label: 'Being built', cls: 'text-accent bg-accent/10' },
              shipped: { label: 'Shipped 🎉', cls: 'text-success bg-success/10' },
            }[r.status]
            return (
              <div key={r.id} className="bg-surface rounded-card p-5 flex gap-4" style={{ boxShadow: cardShadow }}>
                <button
                  onClick={() => upvote(r.id)}
                  disabled={hasVoted}
                  aria-pressed={hasVoted}
                  aria-label="I want this"
                  className={`flex flex-col items-center justify-center w-14 rounded-button border-2 py-2 transition-all flex-shrink-0 ${
                    hasVoted
                      ? 'border-accent bg-accent/10 text-accent cursor-default'
                      : 'border-border text-foreground-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  <svg width="13" height="11" viewBox="0 0 11 9" fill="currentColor" aria-hidden>
                    <path d="M5.5 0L11 9H0L5.5 0Z" />
                  </svg>
                  <span className="text-sm font-bold leading-none mt-1">{r.upvotes}</span>
                  <span className="text-[9px] uppercase tracking-wider mt-1">want</span>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{r.title}</h3>
                  <p className="text-sm text-foreground-muted mt-1.5 leading-relaxed">{r.body}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-foreground-faint flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: avatarColor(r.requester.name) }}
                      >
                        {r.requester.name[0]}
                      </span>
                      <span className="text-foreground-muted">requested by {r.requester.name}</span>
                    </span>
                    <span>·</span>
                    <span>{r.created_at}</span>
                    {r.responses > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-primary font-semibold">{r.responses} maker{r.responses === 1 ? '' : 's'} interested</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
