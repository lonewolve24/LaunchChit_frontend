import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { AdminPageHeader, AdminCard, StatusBadge } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Request = {
  id: string
  title: string
  body: string
  requester: string
  upvotes: number
  responses: number
  status: 'open' | 'in-progress' | 'shipped'
  created_at: string
}

export const Route = createFileRoute('/admin/requests')({ component: AdminRequestsPage })

function AdminRequestsPage() {
  const [items, setItems] = useState<Request[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/admin/requests`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { items: Request[] } | null) => {
        setItems(body?.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Product requests" subtitle="What the community wants built. Surface high-signal requests to makers." />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}</div>
      ) : !items || items.length === 0 ? (
        <EmptyState heading="No requests yet" body="Community members can post requests at /community?tab=requests." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">Request</th>
                  <th className="font-semibold px-5 py-2.5">Requester</th>
                  <th className="font-semibold px-5 py-2.5">Upvotes</th>
                  <th className="font-semibold px-5 py-2.5">Makers interested</th>
                  <th className="font-semibold px-5 py-2.5">Status</th>
                  <th className="font-semibold px-5 py-2.5">Posted</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5">
                      <a href={`/community/requests/${r.id}`} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:text-primary">{r.title}</a>
                      <p className="text-xs text-foreground-muted line-clamp-1 max-w-md mt-0.5">{r.body}</p>
                    </td>
                    <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">{r.requester}</td>
                    <td className="px-5 py-2.5 text-foreground font-bold">{r.upvotes}</td>
                    <td className="px-5 py-2.5 text-foreground">{r.responses}</td>
                    <td className="px-5 py-2.5"><StatusBadge tone={r.status === 'open' ? 'primary' : r.status === 'shipped' ? 'success' : 'warn'}>{r.status}</StatusBadge></td>
                    <td className="px-5 py-2.5 text-foreground-faint whitespace-nowrap">{r.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  )
}
