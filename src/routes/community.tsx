import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { Skeleton } from '../components/Skeleton'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/community')({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (s.tab as 'forums' | 'events' | 'requests' | 'mailing-list' | undefined) ?? undefined,
    category: (s.category as string | undefined) ?? undefined,
    product: (s.product as string | undefined) ?? undefined,
    sort: (s.sort as string | undefined) ?? undefined,
    view: (s.view as 'grid' | 'calendar' | undefined) ?? undefined,
    page: (s.page as number | undefined) ?? undefined,
    page_size: (s.page_size as number | undefined) ?? undefined,
    month: (s.month as string | undefined) ?? undefined,
    mode: (s.mode as string | undefined) ?? undefined,
  }),
  component: CommunityPage,
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Tab = 'forums' | 'events' | 'requests' | 'mailing-list'

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
  slug: string
  title: string
  start: string
  end: string
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

function formatEventDate(iso: string) {
  const d = new Date(iso)
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Community</h1>
            <p className="text-foreground-muted mt-1 text-[15px]">Talk to other Gambian builders. Find events. Request what's missing. Stay in the loop.</p>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
          {(['forums', 'events', 'requests', 'mailing-list'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => navigate({ to: '/community', search: { tab: t } })}
              className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-[1px] transition-colors whitespace-nowrap ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              {t === 'forums' ? 'Forums' : t === 'events' ? 'Events' : t === 'requests' ? 'Software Requests' : 'Mailing List'}
            </button>
          ))}
        </div>

        {tab === 'forums' && <ForumsTab />}
        {tab === 'events' && <EventsTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'mailing-list' && <MailingListTab />}
      </main>
    </div>
  )
}

// ---------- FORUMS ----------
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
      setCategories(Array.isArray(cats) ? cats : [])
      setProductForums(Array.isArray(forums) ? forums : [])
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

  const headerLabel =
    activeCategory ? categories.find((c) => c.slug === activeCategory)?.name ?? 'Forum' :
    activeProduct ? productForums.find((p) => p.slug === activeProduct)?.name ?? 'Forum' :
    'All threads'

  return (
    <div className="flex flex-col lg:flex-row gap-8">
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
            {productForums.map((f) => (
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
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{headerLabel}</h2>
            <p className="text-xs text-foreground-muted mt-0.5">{threads.length} {threads.length === 1 ? 'thread' : 'threads'}</p>
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
                  href={`/community/threads/${t.id}`}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-surface-subtle transition-colors ${i !== 0 ? 'border-t border-border' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(t.author.name) }}
                  >
                    {t.author.name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {t.pinned && <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">📌 Pinned</span>}
                      {cat && <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cat.icon_color }}>{cat.name}</span>}
                      {t.product_slug && (
                        <>
                          <span className="text-foreground-faint text-xs">·</span>
                          <span className="text-[10px] font-semibold text-foreground-faint uppercase tracking-wider">p/{t.product_slug.split('-').slice(0, 2).join('-')}</span>
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
                    <span className="flex flex-col items-center justify-center min-w-[50px] h-12 px-2 text-xs font-semibold text-foreground-muted border border-border rounded-button bg-surface">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      <span className="mt-0.5">{t.replies}</span>
                    </span>
                    <span className="flex flex-col items-center justify-center min-w-[50px] h-12 px-2 text-xs font-bold text-foreground-muted border-2 border-border rounded-button bg-surface">
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden><path d="M5.5 0L11 9H0L5.5 0Z" /></svg>
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

// ---------- EVENTS ----------
const PAGE_SIZES = [10, 25, 50, 100] as const
const EVENT_PAGE_SIZES = [6, 12, 24, 48] as const

function EventsTab() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/community' })
  const view = (search.view as 'grid' | 'calendar') ?? 'grid'
  const page = search.page ?? 1
  const pageSize = search.page_size ?? 6
  const mode = search.mode ?? 'all'
  const month = search.month ?? new Date().toISOString().slice(0, 7)

  const [events, setEvents] = useState<Event[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('view', view)
    params.set('mode', mode)
    if (view === 'calendar') params.set('month', month)
    else { params.set('page', String(page)); params.set('page_size', String(pageSize)) }

    fetch(`${API}/community/events?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data.items) ? data.items : [])
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [view, page, pageSize, mode, month])

  function update(next: Record<string, string | number | undefined>) {
    navigate({ to: '/community', search: { tab: 'events', view, mode, page, page_size: pageSize, month, ...next } })
  }

  return (
    <div className="space-y-5">
      {/* Top controls */}
      <div className="bg-surface rounded-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3" style={{ boxShadow: cardShadow }}>
        <div className="flex items-center gap-1 bg-surface-subtle rounded-button p-1">
          {(['grid', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => update({ view: v, page: 1 })}
              className={`text-sm font-semibold capitalize px-4 py-1.5 rounded-button transition-colors flex items-center gap-1.5 ${
                view === v ? 'bg-surface text-foreground' : 'text-foreground-muted hover:text-foreground'
              }`}
              style={view === v ? { boxShadow: '0 1px 3px rgb(0 0 0 / 0.08)' } : {}}
            >
              {v === 'grid' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              )}
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={mode}
            onChange={(e) => update({ mode: e.target.value, page: 1 })}
            className="bg-surface border border-border rounded-button px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">All formats</option>
            <option value="in-person">In person</option>
            <option value="online">Online</option>
          </select>

          {view === 'calendar' && (
            <input
              type="month"
              value={month}
              onChange={(e) => update({ month: e.target.value })}
              className="bg-surface border border-border rounded-button px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          )}

          <button className="bg-accent text-white text-sm font-semibold px-4 py-1.5 rounded-button hover:bg-accent-dark transition-colors">
            + Suggest event
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-card" />
      ) : view === 'calendar' ? (
        <CalendarView month={month} events={events} />
      ) : (
        <GridView events={events} total={total} page={page} pageSize={pageSize} update={update} />
      )}
    </div>
  )
}

function GridView({ events, total, page, pageSize, update }: { events: Event[]; total: number; page: number; pageSize: number; update: (n: Record<string, string | number | undefined>) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, total)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {events.map((e) => {
          const date = formatEventDate(e.start)
          const pct = (e.attendees / e.capacity) * 100
          return (
            <a
              key={e.id}
              href={`/community/events/${e.id}`}
              className="bg-surface rounded-card overflow-hidden hover:scale-[1.01] transition-transform"
              style={{ boxShadow: cardShadow }}
            >
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
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${e.mode === 'In person' ? 'text-primary bg-primary/10' : 'text-accent bg-accent/10'}`}>
                      {e.mode}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-snug">{e.title}</h3>
                  <p className="text-xs text-foreground-muted mt-1">📍 {e.location}</p>
                  <p className="text-xs text-foreground-faint mt-0.5">Hosted by {e.host}</p>
                  <p className="text-sm text-foreground-muted mt-3 leading-relaxed line-clamp-2">{e.description}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-foreground-muted mb-1">
                      <span>{e.attendees} attending</span>
                      <span>{e.capacity - e.attendees} spots left</span>
                    </div>
                    <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Pagination */}
      <div className="bg-surface rounded-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2" style={{ boxShadow: cardShadow }}>
        <div className="flex items-center gap-3 text-sm text-foreground-muted">
          <span>Showing <span className="font-semibold text-foreground">{showingFrom}–{showingTo}</span> of <span className="font-semibold text-foreground">{total}</span></span>
          <span className="text-foreground-faint">·</span>
          <label className="flex items-center gap-2">
            Show
            <select value={pageSize} onChange={(e) => update({ page_size: Number(e.target.value), page: 1 })} className="bg-surface border border-border rounded-button px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary">
              {EVENT_PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            per page
          </label>
        </div>
        <Pager page={page} totalPages={totalPages} onChange={(p) => update({ page: p })} />
      </div>
    </>
  )
}

function CalendarView({ month, events }: { month: string; events: Event[] }) {
  const [year, m] = month.split('-').map(Number)
  const firstDay = new Date(year, m - 1, 1)
  const lastDay = new Date(year, m, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay() // 0 = Sun

  const eventsByDay: Record<number, Event[]> = {}
  events.forEach((e) => {
    const day = new Date(e.start).getDate()
    if (!eventsByDay[day]) eventsByDay[day] = []
    eventsByDay[day].push(e)
  })

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === m - 1

  return (
    <div className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: cardShadow }}>
      <div className="grid grid-cols-7 border-b border-border bg-surface-subtle">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-2 py-2 text-xs font-bold text-foreground-muted uppercase tracking-wider text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - startWeekday + 1
          const isInMonth = dayNum >= 1 && dayNum <= daysInMonth
          const dayEvents = isInMonth ? (eventsByDay[dayNum] ?? []) : []
          const isToday = isCurrentMonth && today.getDate() === dayNum

          return (
            <div
              key={i}
              className={`min-h-[110px] p-2 border-r border-b border-border ${isInMonth ? 'bg-surface' : 'bg-surface-subtle'} ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
            >
              {isInMonth && (
                <>
                  <div className={`text-xs font-bold mb-1 ${isToday ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white' : 'text-foreground-muted'}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <a
                        key={e.id}
                        href={`/community/events/${e.id}`}
                        className="block text-[11px] font-medium text-white px-1.5 py-0.5 rounded truncate"
                        style={{ backgroundColor: e.color }}
                        title={e.title}
                      >
                        {e.title}
                      </a>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-foreground-faint font-semibold px-1.5">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
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
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page" className={`${btn} bg-surface border-border text-foreground-muted hover:text-foreground hover:border-border-strong disabled:opacity-40`}>‹</button>
      {pages.map((p, i) =>
        p === '…' ? <span key={`e-${i}`} className="text-foreground-faint px-1">…</span>
        : <button key={p} onClick={() => onChange(p)} className={`${btn} ${p === page ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-foreground-muted hover:text-foreground hover:border-border-strong'}`}>{p}</button>
      )}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Next page" className={`${btn} bg-surface border-border text-foreground-muted hover:text-foreground hover:border-border-strong disabled:opacity-40`}>›</button>
    </div>
  )
}

// ---------- REQUESTS ----------
function RequestsTab() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/community' })
  const sort = (search.sort as 'popular' | 'recent') ?? 'popular'
  const page = search.page ?? 1
  const pageSize = search.page_size ?? 10

  const [requests, setRequests] = useState<Request[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ sort, page: String(page), page_size: String(pageSize) })
    fetch(`${API}/community/requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data.items) ? data.items : [])
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sort, page, pageSize])

  function update(next: Record<string, string | number | undefined>) {
    navigate({ to: '/community', search: { tab: 'requests', sort, page, page_size: pageSize, ...next } })
  }

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, total)

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
            <button key={s} onClick={() => update({ sort: s, page: 1 })} className={`text-xs font-semibold capitalize px-3 py-1 rounded-button transition-colors ${sort === s ? 'bg-primary text-white' : 'text-foreground-muted hover:text-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-card" />
      ) : (
        <>
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
                    className={`flex flex-col items-center justify-center w-14 rounded-button border-2 py-2 transition-all flex-shrink-0 ${hasVoted ? 'border-accent bg-accent/10 text-accent cursor-default' : 'border-border text-foreground-muted hover:border-accent hover:text-accent'}`}
                  >
                    <svg width="13" height="11" viewBox="0 0 11 9" fill="currentColor" aria-hidden><path d="M5.5 0L11 9H0L5.5 0Z" /></svg>
                    <span className="text-sm font-bold leading-none mt-1">{r.upvotes}</span>
                    <span className="text-[9px] uppercase tracking-wider mt-1">want</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.label}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{r.title}</h3>
                    <p className="text-sm text-foreground-muted mt-1.5 leading-relaxed">{r.body}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-foreground-faint flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: avatarColor(r.requester.name) }}>{r.requester.name[0]}</span>
                        <span className="text-foreground-muted">requested by {r.requester.name}</span>
                      </span>
                      <span>·</span>
                      <span>{r.created_at}</span>
                      {r.responses > 0 && (<><span>·</span><span className="text-primary font-semibold">{r.responses} maker{r.responses === 1 ? '' : 's'} interested</span></>)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="bg-surface rounded-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2" style={{ boxShadow: cardShadow }}>
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
              <span>Showing <span className="font-semibold text-foreground">{showingFrom}–{showingTo}</span> of <span className="font-semibold text-foreground">{total}</span></span>
              <span className="text-foreground-faint">·</span>
              <label className="flex items-center gap-2">
                Show
                <select value={pageSize} onChange={(e) => update({ page_size: Number(e.target.value), page: 1 })} className="bg-surface border border-border rounded-button px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary">
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                per page
              </label>
            </div>
            <Pager page={page} totalPages={totalPages} onChange={(p) => update({ page: p })} />
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

// ---------- MAILING LIST ----------
const MAILING_TOPICS = [
  { id: 'launches',   label: 'Daily launches digest',     desc: 'A short email with today\'s top Gambian launches, weekday mornings.' },
  { id: 'weekly',     label: 'Weekly community recap',    desc: 'The most-discussed threads, top requests, and upcoming events. Sundays.' },
  { id: 'events',     label: 'Event reminders',           desc: 'A heads-up the day before any event you might want to attend.' },
  { id: 'jobs',       label: 'Jobs from the community',   desc: 'When a Gambian product team is hiring, you hear about it.' },
  { id: 'milestones', label: 'Maker milestones',          desc: 'When a launched product hits a big number — funding, users, revenue.' },
]

function MailingListTab() {
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(['launches', 'weekly']))
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (selected.size === 0) {
      setError('Pick at least one digest to subscribe to.')
      return
    }
    setLoading(true)
    const res = await fetch(`${API}/community/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), topics: Array.from(selected) }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setToast({ message: 'Subscribed. Check your inbox to confirm.', variant: 'success' })
    } else {
      setError('Could not subscribe right now. Try again in a moment.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-surface rounded-card p-6 md:p-8" style={{ boxShadow: cardShadow }}>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Mailing List</p>
          <h2 className="text-2xl font-bold text-foreground">Stay in the loop, on your terms</h2>
          <p className="text-foreground-muted mt-2 leading-relaxed">
            Pick the digests you want. We don't share your email, we don't spam, and you can unsubscribe in one click. Most subscribers get 1–3 emails a week.
          </p>

          {done ? (
            <div className="mt-6 bg-success/10 border border-success/20 rounded-card p-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center text-success flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">You're on the list.</p>
                <p className="text-sm text-foreground-muted mt-0.5">Check <strong>{email}</strong> for a confirmation link. Once you click it, the first digest lands in your inbox the next morning.</p>
                <button onClick={() => { setDone(false); setEmail('') }} className="text-xs text-primary font-semibold hover:underline mt-2">Subscribe another email →</button>
              </div>
            </div>
          ) : (
            <form onSubmit={subscribe} noValidate className="mt-6">
              <label htmlFor="ml-email" className="block text-sm font-semibold text-foreground mb-1.5">Your email</label>
              <input
                id="ml-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-primary transition-all"
              />

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold text-foreground mb-1">What do you want to receive?</p>
                {MAILING_TOPICS.map((t) => {
                  const checked = selected.has(t.id)
                  return (
                    <label key={t.id} className="flex items-start gap-3 p-3 rounded-card border border-border bg-surface-subtle hover:border-border-strong transition-colors cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggle(t.id)} className="mt-0.5 accent-primary w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{t.label}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">{t.desc}</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {error && <p className="text-sm text-destructive mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 bg-accent text-white font-semibold text-sm px-6 py-2.5 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60"
              >
                {loading ? 'Subscribing…' : 'Subscribe'}
              </button>
              <p className="text-xs text-foreground-faint mt-3">By subscribing you agree to our privacy policy. One-click unsubscribe in every email.</p>
            </form>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">Sample subjects</p>
          <ul className="space-y-3 text-sm text-foreground">
            <li>📨 <strong>5 Gambian launches today</strong> — FarmLink GM, PayGam, +3</li>
            <li>📨 <strong>What we discussed this week in Community</strong></li>
            <li>📨 <strong>Builders Meetup tomorrow at 6pm</strong> in Senegambia</li>
            <li>📨 <strong>Hiring: 3 new roles from Gambian builders</strong></li>
          </ul>
        </div>

        <div className="bg-primary rounded-card p-5">
          <p className="text-sm font-bold text-white">2,340 subscribers</p>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">Builders, designers, investors, students, and the diaspora — all reading what The Gambia is shipping.</p>
        </div>
      </aside>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
