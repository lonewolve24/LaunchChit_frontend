import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'open' | 'resolved' | 'dismissed' | 'all'

type Report = {
  id: string
  target_kind: 'comment' | 'thread' | 'product' | 'user'
  target_label: string
  target_href: string
  reason: string
  reported_by: string
  reported_at: string
  status: Exclude<Status, 'all'>
}

type Response = { items: Report[]; counts: { all: number; open: number; resolved: number; dismissed: number } }

export const Route = createFileRoute('/admin/reports')({
  component: AdminReportsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['open', 'resolved', 'dismissed', 'all'].includes(String(s.status)) ? String(s.status) : 'open') as Status,
  }),
})

function AdminReportsPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API}/admin/reports?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], counts: { all: 0, open: 0, resolved: 0, dismissed: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [status])

  async function action(id: string, kind: 'resolve' | 'dismiss') {
    setBusyId(id)
    const res = await fetch(`${API}/admin/reports/${id}/${kind}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: kind === 'resolve' ? 'Report resolved.' : 'Report dismissed.', variant: 'success' })
    load()
  }

  function setTab(s: string) {
    window.location.href = `/admin/reports?status=${s}`
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reports" subtitle="User-submitted reports across comments, threads, products and users." />

      <AdminTabs
        tabs={[
          { value: 'open',      label: 'Open',      count: data?.counts.open },
          { value: 'resolved',  label: 'Resolved',  count: data?.counts.resolved },
          { value: 'dismissed', label: 'Dismissed', count: data?.counts.dismissed },
          { value: 'all',       label: 'All',       count: data?.counts.all },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="No reports match this view." />
      ) : (
        <ul className="space-y-3">
          {data.items.map((r) => (
            <li key={r.id}>
              <AdminCard>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusBadge tone="neutral">{r.target_kind}</StatusBadge>
                      <StatusBadge tone="warn">{r.reason}</StatusBadge>
                      <StatusBadge tone={r.status === 'open' ? 'primary' : r.status === 'resolved' ? 'success' : 'neutral'}>{r.status}</StatusBadge>
                    </div>
                    <a href={r.target_href} className="text-sm font-bold text-foreground hover:text-primary">{r.target_label}</a>
                    <p className="text-xs text-foreground-faint mt-1">Reported by {r.reported_by} · {r.reported_at}</p>
                  </div>
                  {r.status === 'open' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ActionButton tone="success" disabled={busyId === r.id} onClick={() => action(r.id, 'resolve')}>Resolve</ActionButton>
                      <ActionButton disabled={busyId === r.id} onClick={() => action(r.id, 'dismiss')}>Dismiss</ActionButton>
                    </div>
                  )}
                </div>
              </AdminCard>
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
