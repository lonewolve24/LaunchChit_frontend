import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'pending' | 'approved' | 'rejected' | 'all'

type Submission = {
  id: string
  product_name: string
  tagline: string
  maker: string
  maker_username: string
  submitted_at: string
  topics: string[]
  status: Exclude<Status, 'all'>
  reason?: string
}

type Response = { items: Submission[]; counts: { all: number; pending: number; approved: number; rejected: number } }

export const Route = createFileRoute('/admin/submissions')({
  component: AdminSubmissionsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['pending', 'approved', 'rejected', 'all'].includes(String(s.status)) ? String(s.status) : 'pending') as Status,
  }),
})

function AdminSubmissionsPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function load(s: Status) {
    setLoading(true)
    fetch(`${API}/admin/submissions?status=${s}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], counts: { all: 0, pending: 0, approved: 0, rejected: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(status) }, [status])

  async function approve(id: string) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/submissions/${id}/approve`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Could not approve.', variant: 'error' }); return }
    setToast({ message: 'Approved.', variant: 'success' })
    load(status)
  }

  async function reject(id: string) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/submissions/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: rejectReason.trim() || 'Did not meet guidelines.' }),
    })
    setBusyId(null)
    setRejectingId(null)
    setRejectReason('')
    if (!res.ok) { setToast({ message: 'Could not reject.', variant: 'error' }); return }
    setToast({ message: 'Rejected.', variant: 'success' })
    load(status)
  }

  function setTab(s: string) {
    window.location.href = `/admin/submissions?status=${s}`
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Submissions" subtitle="Review new product launches before they go live." />

      <AdminTabs
        tabs={[
          { value: 'pending',  label: 'Pending',  count: data?.counts.pending },
          { value: 'approved', label: 'Approved', count: data?.counts.approved },
          { value: 'rejected', label: 'Rejected', count: data?.counts.rejected },
          { value: 'all',      label: 'All',      count: data?.counts.all },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="No submissions in this view." />
      ) : (
        <ul className="space-y-3">
          {data.items.map((s) => (
            <li key={s.id}>
              <AdminCard>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-foreground">{s.product_name}</h3>
                      <StatusBadge tone={s.status === 'pending' ? 'primary' : s.status === 'approved' ? 'success' : 'danger'}>{s.status}</StatusBadge>
                      {s.topics.map((t) => <StatusBadge key={t} tone="neutral">{t}</StatusBadge>)}
                    </div>
                    <p className="text-sm text-foreground-muted">{s.tagline}</p>
                    <p className="text-xs text-foreground-faint mt-2">
                      <a href={`/profile/${s.maker_username}`} className="hover:text-primary">{s.maker}</a> · submitted {s.submitted_at}
                    </p>
                    {s.reason && (
                      <p className="text-xs text-destructive mt-2">Rejected: {s.reason}</p>
                    )}
                  </div>
                  {s.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ActionButton tone="success" disabled={busyId === s.id} onClick={() => approve(s.id)}>Approve</ActionButton>
                      <ActionButton tone="danger"  disabled={busyId === s.id} onClick={() => setRejectingId(s.id)}>Reject</ActionButton>
                    </div>
                  )}
                </div>
                {rejectingId === s.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Reason (visible to the maker)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      className="w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-destructive"
                      placeholder="e.g. Duplicate of an existing live product."
                    />
                    <div className="flex justify-end gap-2">
                      <ActionButton onClick={() => { setRejectingId(null); setRejectReason('') }}>Cancel</ActionButton>
                      <ActionButton tone="danger" onClick={() => reject(s.id)}>Confirm reject</ActionButton>
                    </div>
                  </div>
                )}
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
