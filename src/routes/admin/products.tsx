import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'all' | 'live' | 'removed'

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  maker: string
  vote_count: number
  comments_count: number
  created_at: string
  status: 'live' | 'removed'
}

type Response = { items: Product[]; total: number; counts: { all: number; live: number; removed: number } }

export const Route = createFileRoute('/admin/products')({
  component: AdminProductsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['all', 'live', 'removed'].includes(String(s.status)) ? String(s.status) : 'all') as Status,
    q: typeof s.q === 'string' ? s.q : '',
  }),
})

function AdminProductsPage() {
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
    fetch(`${API}/admin/products?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], total: 0, counts: { all: 0, live: 0, removed: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [status])
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [query])

  async function setRemoved(id: string, removed: boolean) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/products/${id}/${removed ? 'remove' : 'restore'}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: removed ? 'Product removed.' : 'Product restored.', variant: 'success' })
    load()
  }

  function setTab(s: string) {
    window.location.href = `/admin/products?status=${s}${query ? `&q=${encodeURIComponent(query)}` : ''}`
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        subtitle="Every live product on the platform. Remove anything that violates the guidelines."
        right={
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, slug, maker…"
            className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary w-64"
          />
        }
      />

      <AdminTabs
        tabs={[
          { value: 'all',     label: 'All',     count: data?.counts.all },
          { value: 'live',    label: 'Live',    count: data?.counts.live },
          { value: 'removed', label: 'Removed', count: data?.counts.removed },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="No products match this view." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">Product</th>
                  <th className="font-semibold px-5 py-2.5">Maker</th>
                  <th className="font-semibold px-5 py-2.5">Upvotes</th>
                  <th className="font-semibold px-5 py-2.5">Comments</th>
                  <th className="font-semibold px-5 py-2.5">Status</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5">
                      <a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:text-primary">{p.name}</a>
                      <p className="text-xs text-foreground-muted truncate max-w-md">{p.tagline}</p>
                    </td>
                    <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">{p.maker}</td>
                    <td className="px-5 py-2.5 text-foreground font-bold">{p.vote_count.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-foreground">{p.comments_count.toLocaleString()}</td>
                    <td className="px-5 py-2.5">
                      <StatusBadge tone={p.status === 'live' ? 'success' : 'danger'}>{p.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {p.status === 'live'
                        ? <ActionButton tone="danger" disabled={busyId === p.id} onClick={() => setRemoved(p.id, true)}>Remove</ActionButton>
                        : <ActionButton tone="success" disabled={busyId === p.id} onClick={() => setRemoved(p.id, false)}>Restore</ActionButton>
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
