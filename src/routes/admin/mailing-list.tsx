import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'subscribed' | 'unsubscribed' | 'all'

type Subscriber = {
  id: string
  email: string
  name: string | null
  source: 'organic' | 'profile' | 'launch'
  topics: string[]
  subscribed_at: string
  status: Exclude<Status, 'all'>
}

type Response = { items: Subscriber[]; counts: { all: number; subscribed: number; unsubscribed: number } }

export const Route = createFileRoute('/admin/mailing-list')({
  component: AdminMailingListPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['subscribed', 'unsubscribed', 'all'].includes(String(s.status)) ? String(s.status) : 'subscribed') as Status,
    q: typeof s.q === 'string' ? s.q : '',
  }),
})

function AdminMailingListPage() {
  const { status, q } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [query, setQuery] = useState(q)

  function load() {
    setLoading(true)
    const params = new URLSearchParams({ status })
    if (query) params.set('q', query)
    fetch(`${API}/admin/mailing-list?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], counts: { all: 0, subscribed: 0, unsubscribed: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [status])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [query])

  async function setStatus(id: string, sub: boolean) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/mailing-list/${id}/${sub ? 'resubscribe' : 'unsubscribe'}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: sub ? 'Resubscribed.' : 'Unsubscribed.', variant: 'success' })
    load()
  }

  function setTab(s: string) {
    window.location.href = `/admin/mailing-list?status=${s}${query ? `&q=${encodeURIComponent(query)}` : ''}`
  }

  function exportCsv() {
    if (!data) return
    const header = 'email,name,source,topics,subscribed_at,status'
    const rows = data.items.map((s) =>
      [s.email, s.name ?? '', s.source, s.topics.join('|'), s.subscribed_at, s.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mailing-list-${status}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Mailing list"
        subtitle="Newsletter subscribers and the people who get launch announcements."
        right={
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email or name…"
              className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary w-56"
            />
            <ActionButton onClick={exportCsv}>Export CSV</ActionButton>
          </div>
        }
      />

      <AdminTabs
        tabs={[
          { value: 'subscribed',   label: 'Subscribed',   count: data?.counts.subscribed },
          { value: 'unsubscribed', label: 'Unsubscribed', count: data?.counts.unsubscribed },
          { value: 'all',          label: 'All',          count: data?.counts.all },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="No subscribers match this view." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">Email</th>
                  <th className="font-semibold px-5 py-2.5">Name</th>
                  <th className="font-semibold px-5 py-2.5">Source</th>
                  <th className="font-semibold px-5 py-2.5">Topics</th>
                  <th className="font-semibold px-5 py-2.5">Subscribed</th>
                  <th className="font-semibold px-5 py-2.5">Status</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5"><a href={`mailto:${s.email}`} className="text-foreground hover:text-primary">{s.email}</a></td>
                    <td className="px-5 py-2.5 text-foreground-muted">{s.name ?? <span className="text-foreground-faint">—</span>}</td>
                    <td className="px-5 py-2.5"><StatusBadge tone="neutral">{s.source}</StatusBadge></td>
                    <td className="px-5 py-2.5">
                      {s.topics.length === 0 ? <span className="text-foreground-faint text-xs">—</span> : (
                        <span className="inline-flex gap-1 flex-wrap">{s.topics.map((t) => <StatusBadge key={t} tone="neutral">{t}</StatusBadge>)}</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-foreground-faint whitespace-nowrap">{s.subscribed_at}</td>
                    <td className="px-5 py-2.5"><StatusBadge tone={s.status === 'subscribed' ? 'success' : 'neutral'}>{s.status}</StatusBadge></td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {s.status === 'subscribed'
                        ? <ActionButton tone="danger" disabled={busyId === s.id} onClick={() => setStatus(s.id, false)}>Unsubscribe</ActionButton>
                        : <ActionButton tone="success" disabled={busyId === s.id} onClick={() => setStatus(s.id, true)}>Resubscribe</ActionButton>
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
