import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { Sparkline } from '../../components/Sparkline'
import { AdminPageHeader, AdminCard } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Period = '7d' | '30d' | '90d' | '1y'

type Trend = Array<{ date: string; value: number }>

type AnalyticsResponse = {
  period: Period
  kpis: {
    signups:        number
    signups_delta:  number
    active_users:   number
    active_delta:   number
    products_live:  number
    products_delta: number
    upvotes:        number
    upvotes_delta:  number
  }
  signups_trend:     Trend
  active_trend:      Trend
  upvotes_trend:     Trend
  submissions_trend: Trend
  top_products:      Array<{ slug: string; name: string; vote_count: number }>
  top_topics:        Array<{ slug: string; name: string; product_count: number }>
}

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: '7d',  label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y',  label: '1 year' },
]

export const Route = createFileRoute('/admin/analytics')({
  component: AdminAnalyticsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    period: (['7d', '30d', '90d', '1y'].includes(String(s.period)) ? String(s.period) : '30d') as Period,
  }),
})

function AdminAnalyticsPage() {
  const { period } = Route.useSearch()
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/admin/analytics?period=${period}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => { setData(b); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        subtitle="Platform-wide growth and engagement."
        right={
          <div className="inline-flex bg-surface rounded-button p-0.5 border border-border" style={{ boxShadow: cardShadow }}>
            {PERIODS.map((p) => (
              <a
                key={p.value}
                href={`/admin/analytics?period=${p.value}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-button transition-colors ${
                  period === p.value ? 'bg-surface-subtle text-primary' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
        }
      />

      {loading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
          </div>
          <Skeleton className="h-44 rounded-card" />
          <Skeleton className="h-44 rounded-card" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Signups"        value={data.kpis.signups}       delta={data.kpis.signups_delta} />
            <Kpi label="Active users"   value={data.kpis.active_users}  delta={data.kpis.active_delta} />
            <Kpi label="Products live"  value={data.kpis.products_live} delta={data.kpis.products_delta} />
            <Kpi label="Upvotes"        value={data.kpis.upvotes}       delta={data.kpis.upvotes_delta} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Chart title="Signups"     subtitle={`Daily — last ${labelFor(period)}`} data={data.signups_trend}     valueLabel="signups" />
            <Chart title="Active users" subtitle={`Daily — last ${labelFor(period)}`} data={data.active_trend}     valueLabel="users" />
            <Chart title="Upvotes"     subtitle={`Daily — last ${labelFor(period)}`} data={data.upvotes_trend}     valueLabel="upvotes" />
            <Chart title="Submissions" subtitle={`Daily — last ${labelFor(period)}`} data={data.submissions_trend} valueLabel="submissions" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdminCard>
              <p className="text-sm font-bold text-foreground mb-3">Top products by upvote</p>
              <ul className="space-y-2">
                {data.top_products.map((p) => (
                  <li key={p.slug} className="flex items-center justify-between text-sm">
                    <a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary truncate">{p.name}</a>
                    <span className="font-bold text-foreground">{p.vote_count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </AdminCard>
            <AdminCard>
              <p className="text-sm font-bold text-foreground mb-3">Top topics by product count</p>
              <ul className="space-y-2">
                {data.top_topics.map((t) => (
                  <li key={t.slug} className="flex items-center justify-between text-sm">
                    <a href={`/topics/${t.slug}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary truncate">{t.name}</a>
                    <span className="font-bold text-foreground">{t.product_count}</span>
                  </li>
                ))}
              </ul>
            </AdminCard>
          </div>
        </>
      )}
    </div>
  )
}

function labelFor(p: Period) { return p === '1y' ? 'year' : p }

function Kpi({ label, value, delta }: { label: string; value: number; delta: number }) {
  const positive = delta > 0
  const negative = delta < 0
  return (
    <AdminCard>
      <p className="text-xs font-semibold text-foreground-faint uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
      <p className={`text-xs mt-1 font-semibold ${positive ? 'text-success' : negative ? 'text-destructive' : 'text-foreground-muted'}`}>
        {positive ? '+' : ''}{delta}% vs prior period
      </p>
    </AdminCard>
  )
}

function Chart({ title, subtitle, data, valueLabel }: { title: string; subtitle: string; data: Trend; valueLabel: string }) {
  return (
    <AdminCard>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-foreground-faint mt-0.5 mb-2">{subtitle}. Hover to see daily counts.</p>
      <Sparkline data={data} ariaLabel={`${title} trend`} valueLabel={valueLabel} />
    </AdminCard>
  )
}
