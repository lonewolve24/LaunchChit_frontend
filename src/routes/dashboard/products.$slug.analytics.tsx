import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { PageError } from '../../components/PageError'
import { Sparkline } from '../../components/Sparkline'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

export const Route = createFileRoute('/dashboard/products/$slug/analytics')({
  component: ProductAnalyticsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    period: (['7d', '30d', '90d', '1y'].includes(String(s.period)) ? String(s.period) : '30d') as Period,
  }),
})

type Period = '7d' | '30d' | '90d' | '1y'

type Trend = Array<{ date: string; value: number }>

type AnalyticsResponse = {
  product: { id: string; slug: string; name: string; tagline: string; status: string }
  period: Period
  days: number
  totals: { upvotes: number; waitlist: number; views: number; comments: number }
  previous_totals: { upvotes: number; waitlist: number; views: number; comments: number }
  upvotes_trend: Trend
  waitlist_trend: Trend
  views_trend: Trend
  comments_trend: Trend
  sources: Array<{ source: string; pct: number }>
  referrers: Array<{ host: string; visits: number }>
}

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: '7d',  label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y',  label: '1 year' },
]

function delta(curr: number, prev: number): { sign: '+' | '−' | ''; pct: number } {
  if (prev === 0) return { sign: curr > 0 ? '+' : '', pct: curr > 0 ? 100 : 0 }
  const diff = curr - prev
  const pct = Math.round((Math.abs(diff) / prev) * 100)
  if (diff === 0) return { sign: '', pct: 0 }
  return { sign: diff > 0 ? '+' : '−', pct }
}

function ProductAnalyticsPage() {
  const { slug } = useParams({ from: '/dashboard/products/$slug/analytics' })
  const { period } = Route.useSearch()
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API}/me/products/${slug}/analytics?period=${period}`, { credentials: 'include' })
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((body) => { if (body && !cancelled) { setData(body); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug, period])

  if (notFound) return <PageError status={404} message="That product doesn't exist (or isn't yours)." />

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
        <Skeleton className="h-44 rounded-card" />
        <Skeleton className="h-44 rounded-card" />
      </div>
    )
  }

  const upvotesDelta = delta(data.totals.upvotes, data.previous_totals.upvotes)
  const waitlistDelta = delta(data.totals.waitlist, data.previous_totals.waitlist)
  const viewsDelta = delta(data.totals.views, data.previous_totals.views)
  const commentsDelta = delta(data.totals.comments, data.previous_totals.comments)

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <a href="/dashboard/products" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to my products
        </a>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{data.product.name}</h1>
            <p className="text-foreground-muted mt-1">{data.product.tagline}</p>
            <a href={`/p/${data.product.slug}`} className="text-xs text-primary hover:underline font-semibold mt-2 inline-block">View public page →</a>
          </div>
          <div className="inline-flex bg-surface rounded-button p-0.5 border border-border" style={{ boxShadow: cardShadow }}>
            {PERIODS.map((p) => (
              <a
                key={p.value}
                href={`/dashboard/products/${slug}/analytics?period=${p.value}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-button transition-colors ${
                  period === p.value ? 'bg-surface-subtle text-primary' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* KPI tiles with delta vs previous period */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Page views"    value={data.totals.views}    delta={viewsDelta}    />
        <KpiCard label="Upvotes"       value={data.totals.upvotes}  delta={upvotesDelta}  />
        <KpiCard label="Waitlist joins" value={data.totals.waitlist} delta={waitlistDelta} />
        <KpiCard label="Comments"      value={data.totals.comments} delta={commentsDelta} />
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Page views" subtitle={`Daily totals — last ${labelFor(period)}`} data={data.views_trend} valueLabel="views" />
        <ChartCard title="Upvotes"    subtitle={`Daily totals — last ${labelFor(period)}`} data={data.upvotes_trend} valueLabel="upvotes" />
        <ChartCard title="Waitlist signups" subtitle={`Daily totals — last ${labelFor(period)}`} data={data.waitlist_trend} valueLabel="signups" />
        <ChartCard title="Comments"  subtitle={`Daily totals — last ${labelFor(period)}`} data={data.comments_trend} valueLabel="comments" />
      </div>

      {/* Acquisition + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <p className="text-sm font-bold text-foreground">Where visitors come from</p>
          <p className="text-xs text-foreground-faint mt-0.5 mb-4">Share of {data.totals.views.toLocaleString()} sessions over the last {labelFor(period)}.</p>
          <ul className="space-y-3">
            {data.sources.map((s) => (
              <li key={s.source}>
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span className="text-foreground">{s.source}</span>
                  <span className="font-bold text-foreground">{s.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, s.pct)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <p className="text-sm font-bold text-foreground">Top referrers</p>
          <p className="text-xs text-foreground-faint mt-0.5 mb-4">Hosts sending the most traffic to your product page.</p>
          <ul className="divide-y divide-border">
            {data.referrers.map((r) => (
              <li key={r.host} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <a href={`https://${r.host}`} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:text-primary truncate">{r.host}</a>
                <span className="text-sm font-bold text-foreground">{r.visits.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function labelFor(p: Period) {
  return p === '1y' ? 'year' : p
}

function KpiCard({ label, value, delta }: { label: string; value: number; delta: { sign: '+' | '−' | ''; pct: number } }) {
  const positive = delta.sign === '+'
  const negative = delta.sign === '−'
  return (
    <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
      <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
      <p className={`text-xs mt-1 font-semibold ${positive ? 'text-success' : negative ? 'text-destructive' : 'text-foreground-muted'}`}>
        {delta.sign}
        {delta.pct}% vs previous period
      </p>
    </div>
  )
}

function ChartCard({ title, subtitle, data, valueLabel }: { title: string; subtitle: string; data: Trend; valueLabel: string }) {
  return (
    <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-foreground-faint mt-0.5">{subtitle}. Hover to see daily counts.</p>
      <div className="mt-3"><Sparkline data={data} ariaLabel={`${title} trend`} valueLabel={valueLabel} /></div>
    </div>
  )
}
