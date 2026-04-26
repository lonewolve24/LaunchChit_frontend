import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { KpiTile } from '../../components/KpiTile'
import { Sparkline } from '../../components/Sparkline'
import { Skeleton } from '../../components/Skeleton'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Period = '7d' | '30d' | '90d'

type Stats = {
  totals: { upvotes: number; comments: number; waitlist: number; profile_views: number }
  deltas: { upvotes: number; comments: number; waitlist: number; profile_views: number }
  period: Period
  trend: Array<{ date: string; value: number }>
  activity: Array<{ id: string; kind: string; text: string; ago: string }>
}

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
  validateSearch: (s: Record<string, unknown>) => ({
    period: (s.period === '30d' || s.period === '90d' ? s.period : '7d') as Period,
  }),
})

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'

function ActivityIcon({ kind }: { kind: string }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (kind === 'upvote') return <svg {...common}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
  if (kind === 'comment') return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  if (kind === 'waitlist') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
  if (kind === 'review') return <svg {...common}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="m8 14 4-4 4 4" /></svg>
}

function DashboardHome() {
  const { period } = Route.useSearch()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API}/me/dashboard/stats?period=${period}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Stats | null) => {
        if (cancelled) return
        setStats(data)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [period])

  function setPeriod(p: Period) {
    navigate({ to: '/dashboard', search: { period: p } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground-muted mt-1">Welcome back. Here's how your products are doing.</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-card" />)
        ) : (
          <>
            <KpiTile label="Total upvotes"   value={stats.totals.upvotes.toLocaleString()}   delta={stats.deltas.upvotes} hint={`vs prev ${period}`} />
            <KpiTile label="Comments"        value={stats.totals.comments.toLocaleString()}  delta={stats.deltas.comments} hint={`vs prev ${period}`} />
            <KpiTile label="Waitlist signups" value={stats.totals.waitlist.toLocaleString()} delta={stats.deltas.waitlist} hint={`vs prev ${period}`} />
            <KpiTile label="Profile views"   value={stats.totals.profile_views.toLocaleString()} delta={stats.deltas.profile_views} hint={`vs prev ${period}`} />
          </>
        )}
      </div>

      {/* Trend chart */}
      <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Upvotes over time</h2>
            <p className="text-xs text-foreground-faint mt-0.5">Daily totals across all your products.</p>
          </div>
          <div className="inline-flex bg-surface-subtle rounded-button p-0.5 border border-border">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-button transition-colors cursor-pointer ${
                  period === p ? 'bg-surface text-primary shadow-sm' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {loading || !stats ? (
          <Skeleton className="h-[120px] w-full rounded" />
        ) : (
          <Sparkline data={stats.trend} ariaLabel={`Upvotes over the last ${period}`} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="bg-surface rounded-card p-5 lg:col-span-2" style={{ boxShadow: cardShadow }}>
          <h2 className="text-base font-bold text-foreground mb-4">Recent activity</h2>
          {loading || !stats ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
            </div>
          ) : stats.activity.length === 0 ? (
            <p className="text-sm text-foreground-muted">Nothing new yet. Submit a product to get started.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-7 h-7 rounded-full bg-primary-muted text-primary flex items-center justify-center flex-shrink-0">
                    <ActivityIcon kind={a.kind} />
                  </span>
                  <p className="text-sm text-foreground flex-1 min-w-0">{a.text}</p>
                  <span className="text-xs text-foreground-faint flex-shrink-0">{a.ago}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <h2 className="text-base font-bold text-foreground mb-4">Quick actions</h2>
          <div className="space-y-2">
            <Link to="/submit" className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-button bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors">
              + New launch
              <span aria-hidden>→</span>
            </Link>
            <a href="/dashboard/products" className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-button border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors">
              Manage products
              <span aria-hidden>→</span>
            </a>
            <a href="/profile/musa-jallow" className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-button border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors">
              View public profile
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
