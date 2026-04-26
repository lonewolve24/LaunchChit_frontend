import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'open' | 'hidden' | 'all'

type Comment = {
  id: string
  body: string
  author: string
  author_username: string
  product_name: string
  product_slug: string
  created_at: string
  status: Exclude<Status, 'all'>
  reports: number
}

type Response = { items: Comment[]; counts: { all: number; open: number; hidden: number } }

export const Route = createFileRoute('/admin/comments')({
  component: AdminCommentsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['open', 'hidden', 'all'].includes(String(s.status)) ? String(s.status) : 'open') as Status,
  }),
})

function AdminCommentsPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API}/admin/comments?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], counts: { all: 0, open: 0, hidden: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [status])

  async function setHidden(id: string, hidden: boolean) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/comments/${id}/${hidden ? 'hide' : 'restore'}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: hidden ? 'Comment hidden.' : 'Comment restored.', variant: 'success' })
    load()
  }

  function setTab(s: string) {
    window.location.href = `/admin/comments?status=${s}`
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Comments" subtitle="Hide spam, harassment, or anything that violates the guidelines. Hidden comments stay archived for audit." />

      <AdminTabs
        tabs={[
          { value: 'open',   label: 'Open',   count: data?.counts.open },
          { value: 'hidden', label: 'Hidden', count: data?.counts.hidden },
          { value: 'all',    label: 'All',    count: data?.counts.all },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="No comments match this view." />
      ) : (
        <ul className="space-y-3">
          {data.items.map((c) => (
            <li key={c.id}>
              <AdminCard>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <a href={`/profile/${c.author_username}`} className="text-sm font-bold text-foreground hover:text-primary">{c.author}</a>
                      <span className="text-foreground-faint text-xs">on</span>
                      <a href={`/p/${c.product_slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground-muted hover:text-primary">{c.product_name}</a>
                      <span className="text-foreground-faint text-xs">·</span>
                      <span className="text-xs text-foreground-faint">{c.created_at}</span>
                      <StatusBadge tone={c.status === 'open' ? 'neutral' : 'danger'}>{c.status}</StatusBadge>
                      {c.reports > 0 && <StatusBadge tone="warn">{c.reports} reports</StatusBadge>}
                    </div>
                    <p className="text-sm text-foreground mt-1 leading-relaxed">{c.body}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.status === 'open'
                      ? <ActionButton tone="danger" disabled={busyId === c.id} onClick={() => setHidden(c.id, true)}>Hide</ActionButton>
                      : <ActionButton tone="success" disabled={busyId === c.id} onClick={() => setHidden(c.id, false)}>Restore</ActionButton>
                    }
                  </div>
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
