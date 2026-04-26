import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { AdminPageHeader, AdminCard, StatusBadge } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Service = {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime_pct: number
  latency_ms: number
  last_incident: string
}

type Job = {
  id: string
  name: string
  last_run: string
  status: 'ok' | 'retry' | 'failed'
  duration_ms: number
}

type Response = { services: Service[]; jobs: Job[] }

export const Route = createFileRoute('/admin/health')({ component: AdminHealthPage })

function AdminHealthPage() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/admin/health`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: Response | null) => { setData(b); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Health" subtitle="Service status, latency, and background job freshness." />

      <section>
        <h2 className="text-base font-bold text-foreground mb-3">Services</h2>
        {loading || !data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.services.map((s) => (
              <li key={s.name}>
                <AdminCard>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                    <StatusBadge tone={s.status === 'healthy' ? 'success' : s.status === 'degraded' ? 'warn' : 'danger'}>{s.status}</StatusBadge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
                    <div>
                      <p className="text-base font-bold text-foreground">{s.uptime_pct}%</p>
                      <p className="text-[10px] text-foreground-faint uppercase tracking-wider">Uptime</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{s.latency_ms}ms</p>
                      <p className="text-[10px] text-foreground-faint uppercase tracking-wider">p50 latency</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground-muted truncate">{s.last_incident}</p>
                      <p className="text-[10px] text-foreground-faint uppercase tracking-wider">Last incident</p>
                    </div>
                  </div>
                </AdminCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-bold text-foreground mb-3">Background jobs</h2>
        {loading || !data ? (
          <Skeleton className="h-32 rounded-card" />
        ) : (
          <AdminCard padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-subtle text-foreground-muted">
                  <tr className="text-left">
                    <th className="font-semibold px-5 py-2.5">Job</th>
                    <th className="font-semibold px-5 py-2.5">Last run</th>
                    <th className="font-semibold px-5 py-2.5">Status</th>
                    <th className="font-semibold px-5 py-2.5">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.jobs.map((j) => (
                    <tr key={j.id} className="border-t border-border hover:bg-surface-subtle/60">
                      <td className="px-5 py-2.5 text-foreground font-medium">{j.name}</td>
                      <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">{j.last_run}</td>
                      <td className="px-5 py-2.5"><StatusBadge tone={j.status === 'ok' ? 'success' : j.status === 'retry' ? 'warn' : 'danger'}>{j.status}</StatusBadge></td>
                      <td className="px-5 py-2.5 text-foreground">{j.duration_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        )}
      </section>
    </div>
  )
}
