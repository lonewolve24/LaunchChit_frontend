import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { KpiTile } from '../../components/KpiTile'
import { Sparkline } from '../../components/Sparkline'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

export const Route = createFileRoute('/admin/')({ component: AdminDashboard })

type Stats = {
  kpis: {
    signups_today: number
    signups_delta: number
    products_in_review: number
    comments_flagged: number
    threads_flagged: number
    active_makers_30d: number
    active_makers_delta: number
  }
  submissions_trend: Array<{ date: string; value: number }>
  recent_activity: Array<{ id: string; kind: string; text: string; actor: string; ago: string; href: string }>
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/admin/dashboard/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) { setStats(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground-muted mt-1">Today's queue, this week's traffic, and what needs attention.</p>
      </header>

      {loading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile label="Signups today"     value={stats.kpis.signups_today.toLocaleString()}   hint={`${stats.kpis.signups_delta >= 0 ? '+' : ''}${stats.kpis.signups_delta} vs yesterday`} />
          <KpiTile label="Products in review" value={stats.kpis.products_in_review.toLocaleString()} hint={`${stats.kpis.comments_flagged} flagged comments · ${stats.kpis.threads_flagged} flagged threads`} />
          <KpiTile label="Active makers (30d)" value={stats.kpis.active_makers_30d.toLocaleString()} hint={`${stats.kpis.active_makers_delta >= 0 ? '+' : ''}${stats.kpis.active_makers_delta} vs prior period`} />
          <KpiTile label="Open reports"      value={(stats.kpis.comments_flagged + stats.kpis.threads_flagged).toLocaleString()} hint="Across comments and threads" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <p className="text-sm font-bold text-foreground">Submissions — last 14 days</p>
          <p className="text-xs text-foreground-faint mt-0.5 mb-3">Hover for daily counts.</p>
          {loading || !stats ? <Skeleton className="h-32 rounded-card" /> : (
            <Sparkline data={stats.submissions_trend} ariaLabel="Submissions trend" valueLabel="submissions" />
          )}
        </section>

        <section className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
          <p className="text-sm font-bold text-foreground mb-3">Recent activity</p>
          {loading || !stats ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-card" />)}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent_activity.map((a) => (
                <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                  <a href={a.href} className="block hover:bg-surface-subtle/50 -mx-2 px-2 py-1 rounded-button transition-colors">
                    <p className="text-sm text-foreground line-clamp-1">{a.text}</p>
                    <p className="text-xs text-foreground-faint mt-0.5">{a.actor} · {a.ago}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
        <p className="text-sm font-bold text-foreground">Phase-1 status</p>
        <p className="text-xs text-foreground-muted mt-1">
          Auth, MFA, layout shell, and the dashboard skeleton are live. Moderation queues, user / maker management, editorial CMS, comms, and insights ship in upcoming phases — sidebar entries marked <em>Soon</em>.
        </p>
      </section>
    </div>
  )
}
