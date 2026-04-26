import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Topic = {
  id: string
  slug: string
  name: string
  description: string
  product_count: number
  featured: boolean
}

export const Route = createFileRoute('/admin/topics')({ component: AdminTopicsPage })

function AdminTopicsPage() {
  const [items, setItems] = useState<Topic[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [composing, setComposing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function load() {
    setLoading(true)
    fetch(`${API}/admin/topics`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { items: Topic[] } | null) => {
        setItems(body?.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function create() {
    if (!name.trim()) { setToast({ message: 'Name required.', variant: 'error' }); return }
    const res = await fetch(`${API}/admin/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    })
    if (!res.ok) { setToast({ message: 'Could not create topic.', variant: 'error' }); return }
    setComposing(false); setName(''); setDescription('')
    setToast({ message: 'Topic created.', variant: 'success' })
    load()
  }

  async function toggleFeatured(id: string, on: boolean) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ featured: on }),
    })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: on ? 'Featured.' : 'Unfeatured.', variant: 'success' })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this topic? Products tagged with it will be untagged.')) return
    const res = await fetch(`${API}/admin/topics/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { setToast({ message: 'Could not delete.', variant: 'error' }); return }
    setToast({ message: 'Deleted.', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Topics"
        subtitle="Categories that products can be tagged with. Featured topics surface on the homepage and topics page."
        right={<ActionButton tone="primary" onClick={() => setComposing((c) => !c)}>{composing ? 'Cancel' : '+ New topic'}</ActionButton>}
      />

      {composing && (
        <AdminCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. ClimateTech" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="One-line summary" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <ActionButton tone="primary" onClick={create}>Create topic</ActionButton>
            </div>
          </div>
        </AdminCard>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
      ) : !items || items.length === 0 ? (
        <EmptyState heading="No topics" body="Create the first one above." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">Topic</th>
                  <th className="font-semibold px-5 py-2.5">Slug</th>
                  <th className="font-semibold px-5 py-2.5">Products</th>
                  <th className="font-semibold px-5 py-2.5">Featured</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5">
                      <p className="text-foreground font-medium">{t.name}</p>
                      <p className="text-xs text-foreground-muted">{t.description}</p>
                    </td>
                    <td className="px-5 py-2.5 text-foreground-faint font-mono text-xs">{t.slug}</td>
                    <td className="px-5 py-2.5 text-foreground">{t.product_count}</td>
                    <td className="px-5 py-2.5">{t.featured ? <StatusBadge tone="primary">featured</StatusBadge> : <span className="text-foreground-faint text-xs">—</span>}</td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <ActionButton disabled={busyId === t.id} onClick={() => toggleFeatured(t.id, !t.featured)}>{t.featured ? 'Unfeature' : 'Feature'}</ActionButton>
                        <ActionButton tone="danger" onClick={() => remove(t.id)}>Delete</ActionButton>
                      </div>
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
