import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { getMe } from '../../lib/auth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const Route = createFileRoute('/dashboard/waitlist')({ component: WaitlistPage })

type Signup = {
  id: string
  name: string
  email: string
  phone: string | null
  source: 'organic' | 'referral' | 'twitter' | 'newsletter'
  joined_at: string
}

type WaitlistGroup = {
  product_id: string
  product_slug: string
  product_name: string
  total: number
  signups: Signup[]
}

type WaitlistResponse = { total: number; products: WaitlistGroup[] }

const SOURCES: Array<{ value: 'all' | Signup['source']; label: string }> = [
  { value: 'all',        label: 'All sources' },
  { value: 'organic',    label: 'Organic' },
  { value: 'referral',   label: 'Referral' },
  { value: 'twitter',    label: 'Twitter' },
  { value: 'newsletter', label: 'Newsletter' },
]

function WaitlistPage() {
  const [data, setData] = useState<WaitlistResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [productFilter, setProductFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | Signup['source']>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const me = await getMe()
      if (!me?.name) { if (!cancelled) { setLoading(false); setData({ total: 0, products: [] }) } return }
      const username = me.name.toLowerCase().replace(/\s+/g, '-')
      const res = await fetch(`${API}/profile/${username}/waitlist`, { credentials: 'include' })
      if (cancelled) return
      if (!res.ok) { setData({ total: 0, products: [] }); setLoading(false); return }
      const body: WaitlistResponse = await res.json()
      setData(body)
      setExpanded(body.products.length === 1 ? new Set([body.products[0].product_id]) : new Set())
      setLoading(false)
    })().catch(() => { if (!cancelled) { setLoading(false); setData({ total: 0, products: [] }) } })
    return () => { cancelled = true }
  }, [])

  const filteredGroups = useMemo<WaitlistGroup[]>(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.products
      .filter((g) => productFilter === 'all' || g.product_slug === productFilter)
      .map((g) => ({
        ...g,
        signups: g.signups.filter((s) => {
          if (sourceFilter !== 'all' && s.source !== sourceFilter) return false
          if (!q) return true
          return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone ?? '').toLowerCase().includes(q)
        }),
      }))
  }, [data, productFilter, sourceFilter, query])

  // When the user filters or searches, expand every group so matches are visible.
  useEffect(() => {
    if (!data) return
    if (query.trim() || sourceFilter !== 'all') {
      setExpanded(new Set(data.products.map((g) => g.product_id)))
      return
    }
    if (productFilter !== 'all') {
      const m = data.products.find((g) => g.product_slug === productFilter)
      if (m) setExpanded(new Set([m.product_id]))
    }
  }, [productFilter, sourceFilter, query, data])

  const totalShown = filteredGroups.reduce((s, g) => s + g.signups.length, 0)
  const totalAcrossAll = data?.total ?? 0

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function copyEmails(emails: string[]) {
    if (emails.length === 0) { setToast({ message: 'No emails to copy.', variant: 'error' }); return }
    navigator.clipboard.writeText(emails.join(', '))
      .then(() => setToast({ message: `Copied ${emails.length} ${emails.length === 1 ? 'email' : 'emails'}.`, variant: 'success' }))
      .catch(() => setToast({ message: 'Could not copy.', variant: 'error' }))
  }

  function downloadCsv(group: WaitlistGroup) {
    const header = 'name,email,phone,source,joined_at,product'
    const rows = group.signups.map((s) =>
      [s.name, s.email, s.phone ?? '', s.source, s.joined_at, group.product_name]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${group.product_name.toLowerCase().replace(/\s+/g, '-')}-waitlist.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadAllCsv() {
    if (!data) return
    const header = 'product,name,email,phone,source,joined_at'
    const rows = filteredGroups.flatMap((g) => g.signups.map((s) =>
      [g.product_name, s.name, s.email, s.phone ?? '', s.source, s.joined_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    ))
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-export.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Waitlist</h1>
          <p className="text-foreground-muted mt-1">
            {loading ? 'Loading…' : `${totalAcrossAll.toLocaleString()} ${totalAcrossAll === 1 ? 'person is' : 'people are'} on your waitlists. Reach out for market research or launch updates.`}
          </p>
        </div>
        {!loading && totalAcrossAll > 0 && (
          <button
            type="button"
            onClick={downloadAllCsv}
            className="text-sm font-semibold px-4 py-2 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
          >
            Export all (CSV)
          </button>
        )}
      </header>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-44 rounded-card" />
        </div>
      ) : !data || data.products.length === 0 ? (
        <EmptyState
          heading="No waitlist signups yet"
          body="Once people join your product waitlists they'll show up here, with their contact info so you can reach out."
          cta={{ label: 'Submit a product', onClick: () => { window.location.href = '/submit' } }}
        />
      ) : (
        <>
          {/* Filter bar */}
          <div className="bg-surface rounded-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
            <p className="text-xs text-foreground-muted">
              Showing <span className="font-bold text-foreground">{totalShown.toLocaleString()}</span> of <span className="font-bold text-foreground">{totalAcrossAll.toLocaleString()}</span> signups
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary"
              >
                <option value="all">All products</option>
                {data.products.map((g) => (
                  <option key={g.product_slug} value={g.product_slug}>{g.product_name}</option>
                ))}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as 'all' | Signup['source'])}
                className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary"
              >
                {SOURCES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email or phone…"
                className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary w-56"
              />
              {data.products.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = expanded.size === data.products.length
                    setExpanded(allOpen ? new Set() : new Set(data.products.map((g) => g.product_id)))
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
                >
                  {expanded.size === data.products.length ? 'Collapse all' : 'Expand all'}
                </button>
              )}
            </div>
          </div>

          {/* Per-product collapsible groups */}
          {filteredGroups.map((group) => {
            const isOpen = expanded.has(group.product_id)
            return (
              <div key={group.product_id} className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
                <header className={`flex items-center justify-between gap-3 px-5 py-3 ${isOpen ? 'border-b border-border' : ''}`}>
                  <button
                    type="button"
                    onClick={() => toggle(group.product_id)}
                    aria-expanded={isOpen}
                    aria-controls={`waitlist-${group.product_id}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className={`flex-shrink-0 text-foreground-faint group-hover:text-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-foreground group-hover:text-primary truncate block">
                        {group.product_name}
                      </span>
                      <span className="text-xs text-foreground-faint mt-0.5 block">
                        {group.signups.length.toLocaleString()} {query || sourceFilter !== 'all' ? 'matching' : 'shown'} · {group.total.toLocaleString()} total
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => copyEmails(group.signups.map((s) => s.email))}
                      className="text-xs font-semibold px-3 py-1.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
                    >
                      Copy emails
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCsv(group)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>
                </header>

                {isOpen && (
                  <div id={`waitlist-${group.product_id}`}>
                    {group.signups.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-foreground-muted text-center">No matches.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-subtle text-foreground-muted">
                            <tr className="text-left">
                              <th className="font-semibold px-5 py-2.5">Name</th>
                              <th className="font-semibold px-5 py-2.5">Email</th>
                              <th className="font-semibold px-5 py-2.5">Phone</th>
                              <th className="font-semibold px-5 py-2.5">Source</th>
                              <th className="font-semibold px-5 py-2.5">Joined</th>
                              <th className="font-semibold px-5 py-2.5 text-right">Reach out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.signups.map((s) => (
                              <tr key={s.id} className="border-t border-border hover:bg-surface-subtle/60">
                                <td className="px-5 py-2.5 text-foreground font-medium whitespace-nowrap">{s.name}</td>
                                <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">
                                  <a href={`mailto:${s.email}`} className="hover:text-primary">{s.email}</a>
                                </td>
                                <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">
                                  {s.phone ? <a href={`tel:${s.phone.replace(/\s+/g, '')}`} className="hover:text-primary">{s.phone}</a> : <span className="text-foreground-faint">—</span>}
                                </td>
                                <td className="px-5 py-2.5 whitespace-nowrap">
                                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-button bg-surface-subtle text-foreground-muted capitalize border border-border">
                                    {s.source}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 text-foreground-faint whitespace-nowrap">
                                  {new Date(s.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-5 py-2.5 text-right whitespace-nowrap">
                                  <a
                                    href={`mailto:${s.email}?subject=${encodeURIComponent(`About ${group.product_name}`)}`}
                                    className="text-xs font-semibold text-primary hover:underline"
                                  >
                                    Email
                                  </a>
                                  {s.phone && (
                                    <>
                                      <span className="text-foreground-faint mx-2">·</span>
                                      <a
                                        href={`https://wa.me/${s.phone.replace(/[^\d]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-primary hover:underline"
                                      >
                                        WhatsApp
                                      </a>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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
