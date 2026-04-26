import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'open' | 'locked' | 'all'

type Thread = {
  id: string
  title: string
  category: string
  author: string
  author_username: string
  replies: number
  upvotes: number
  reports: number
  status: Exclude<Status, 'all'>
  last_reply_at: string
}

type Response = { items: Thread[]; counts: { all: number; open: number; locked: number } }

export const Route = createFileRoute('/admin/threads')({
  component: AdminThreadsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['open', 'locked', 'all'].includes(String(s.status)) ? String(s.status) : 'open') as Status,
  }),
})

function AdminThreadsPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API}/admin/threads?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], counts: { all: 0, open: 0, locked: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [status])

  async function setLocked(id: string, locked: boolean) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/threads/${id}/${locked ? 'lock' : 'unlock'}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: locked ? 'Thread locked.' : 'Thread unlocked.', variant: 'success' })
    load()
  }

  function setTab(s: string) {
    window.location.href = `/admin/threads?status=${s}`
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Threads" subtitle="Forum threads. Lock anything that's gone off the rails — replies are blocked but the history stays." />

      <AdminTabs
        tabs={[
          { value: 'open',   label: 'Open',   count: data?.counts.open },
          { value: 'locked', label: 'Locked', count: data?.counts.locked },
          { value: 'all',    label: 'All',    count: data?.counts.all },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="No threads match this view." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">Thread</th>
                  <th className="font-semibold px-5 py-2.5">Author</th>
                  <th className="font-semibold px-5 py-2.5">Replies</th>
                  <th className="font-semibold px-5 py-2.5">Upvotes</th>
                  <th className="font-semibold px-5 py-2.5">Reports</th>
                  <th className="font-semibold px-5 py-2.5">Status</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5">
                      <p className="text-foreground font-medium line-clamp-1 max-w-md">{t.title}</p>
                      <p className="text-xs text-foreground-faint mt-0.5">{t.category} · last reply {t.last_reply_at}</p>
                    </td>
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      <a href={`/profile/${t.author_username}`} className="text-foreground-muted hover:text-primary">{t.author}</a>
                    </td>
                    <td className="px-5 py-2.5 text-foreground">{t.replies}</td>
                    <td className="px-5 py-2.5 text-foreground">{t.upvotes}</td>
                    <td className="px-5 py-2.5">{t.reports > 0 ? <StatusBadge tone="warn">{t.reports}</StatusBadge> : <span className="text-foreground-faint text-xs">0</span>}</td>
                    <td className="px-5 py-2.5"><StatusBadge tone={t.status === 'open' ? 'success' : 'danger'}>{t.status}</StatusBadge></td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {t.status === 'open'
                        ? <ActionButton tone="danger" disabled={busyId === t.id} onClick={() => setLocked(t.id, true)}>Lock</ActionButton>
                        : <ActionButton tone="success" disabled={busyId === t.id} onClick={() => setLocked(t.id, false)}>Unlock</ActionButton>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
