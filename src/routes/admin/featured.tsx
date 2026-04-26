import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminCard, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type ProductRow = { id: string; slug: string; name: string; tagline: string; vote_count: number }
type Response = { featured: ProductRow[]; candidates: ProductRow[] }

export const Route = createFileRoute('/admin/featured')({ component: AdminFeaturedPage })

function AdminFeaturedPage() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API}/admin/featured`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { featured: [], candidates: [] })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function add(id: string) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/featured/${id}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: 'Pinned to featured.', variant: 'success' })
    load()
  }

  async function remove(id: string) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/featured/${id}`, { method: 'DELETE', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: 'Removed from featured.', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Featured" subtitle="Products surfaced on the homepage spotlight rail. Keep the list tight — 3 to 6 picks at most." />

      <section>
        <h2 className="text-base font-bold text-foreground mb-3">Currently featured</h2>
        {loading ? (
          <Skeleton className="h-32 rounded-card" />
        ) : !data || data.featured.length === 0 ? (
          <AdminCard><p className="text-sm text-foreground-muted text-center py-6">No featured products. Pick from the list below.</p></AdminCard>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.featured.map((p) => (
              <li key={p.id}>
                <AdminCard>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground hover:text-primary block truncate">{p.name}</a>
                      <p className="text-xs text-foreground-muted truncate">{p.tagline}</p>
                      <p className="text-xs text-foreground-faint mt-1">{p.vote_count.toLocaleString()} upvotes</p>
                    </div>
                    <ActionButton tone="danger" disabled={busyId === p.id} onClick={() => remove(p.id)}>Unfeature</ActionButton>
                  </div>
                </AdminCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-bold text-foreground mb-3">Top candidates</h2>
        {loading ? (
          <Skeleton className="h-32 rounded-card" />
        ) : !data || data.candidates.length === 0 ? (
          <AdminCard><p className="text-sm text-foreground-muted text-center py-6">No more candidates.</p></AdminCard>
        ) : (
          <AdminCard padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-subtle text-foreground-muted">
                  <tr className="text-left">
                    <th className="font-semibold px-5 py-2.5">Product</th>
                    <th className="font-semibold px-5 py-2.5">Upvotes</th>
                    <th className="font-semibold px-5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.candidates.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-surface-subtle/60">
                      <td className="px-5 py-2.5">
                        <a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:text-primary">{p.name}</a>
                        <p className="text-xs text-foreground-muted truncate max-w-md">{p.tagline}</p>
                      </td>
                      <td className="px-5 py-2.5 text-foreground font-bold">{p.vote_count.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <ActionButton tone="primary" disabled={busyId === p.id} onClick={() => add(p.id)}>Pin</ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
