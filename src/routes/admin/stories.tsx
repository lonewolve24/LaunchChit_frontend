import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'all' | 'published' | 'draft'

type Story = {
  id: string
  title: string
  category: 'Founder Story' | 'Industry' | 'Field Notes' | 'Deep Dive'
  author: string
  status: Exclude<Status, 'all'>
  created_at: string
  updated_at: string
}

type Response = { items: Story[]; counts: { all: number; published: number; draft: number } }

export const Route = createFileRoute('/admin/stories')({
  component: AdminStoriesPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['all', 'published', 'draft'].includes(String(s.status)) ? String(s.status) : 'all') as Status,
  }),
})

const CATEGORIES: Array<Story['category']> = ['Founder Story', 'Industry', 'Field Notes', 'Deep Dive']

function AdminStoriesPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  // Compose
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState<Story['category']>('Founder Story')

  function load() {
    setLoading(true)
    fetch(`${API}/admin/stories?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], counts: { all: 0, published: 0, draft: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [status])

  function setTab(s: string) {
    window.location.href = `/admin/stories?status=${s}`
  }

  async function create() {
    if (!title.trim() || !author.trim()) { setToast({ message: 'Title and author required.', variant: 'error' }); return }
    const res = await fetch(`${API}/admin/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: title.trim(), author: author.trim(), category }),
    })
    if (!res.ok) { setToast({ message: 'Could not create draft.', variant: 'error' }); return }
    setComposing(false); setTitle(''); setAuthor(''); setCategory('Founder Story')
    setToast({ message: 'Draft created.', variant: 'success' })
    load()
  }

  async function publish(id: string, on: boolean) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/stories/${id}/${on ? 'publish' : 'unpublish'}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: on ? 'Published.' : 'Moved to draft.', variant: 'success' })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this story? This cannot be undone.')) return
    const res = await fetch(`${API}/admin/stories/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { setToast({ message: 'Could not delete.', variant: 'error' }); return }
    setToast({ message: 'Deleted.', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Stories"
        subtitle="Editorial pieces published to /stories. Drafts stay invisible until you hit Publish."
        right={<ActionButton tone="primary" onClick={() => setComposing((c) => !c)}>{composing ? 'Cancel' : '+ New story'}</ActionButton>}
      />

      {composing && (
        <AdminCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Working title…" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Story['category'])} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm bg-surface focus:outline-none focus:border-primary">
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Author</label>
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Display byline" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <ActionButton tone="primary" onClick={create}>Create draft</ActionButton>
            </div>
          </div>
        </AdminCard>
      )}

      <AdminTabs
        tabs={[
          { value: 'all',       label: 'All',       count: data?.counts.all },
          { value: 'published', label: 'Published', count: data?.counts.published },
          { value: 'draft',     label: 'Drafts',    count: data?.counts.draft },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="Hit + New story to draft something." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">Title</th>
                  <th className="font-semibold px-5 py-2.5">Category</th>
                  <th className="font-semibold px-5 py-2.5">Author</th>
                  <th className="font-semibold px-5 py-2.5">Status</th>
                  <th className="font-semibold px-5 py-2.5">Updated</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5">
                      <p className="text-foreground font-medium line-clamp-1 max-w-md">{s.title}</p>
                    </td>
                    <td className="px-5 py-2.5"><StatusBadge tone="neutral">{s.category}</StatusBadge></td>
                    <td className="px-5 py-2.5 text-foreground-muted">{s.author}</td>
                    <td className="px-5 py-2.5"><StatusBadge tone={s.status === 'published' ? 'success' : 'warn'}>{s.status}</StatusBadge></td>
                    <td className="px-5 py-2.5 text-foreground-faint whitespace-nowrap">{s.updated_at}</td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        {s.status === 'draft'
                          ? <ActionButton tone="primary" disabled={busyId === s.id} onClick={() => publish(s.id, true)}>Publish</ActionButton>
                          : <ActionButton disabled={busyId === s.id} onClick={() => publish(s.id, false)}>Unpublish</ActionButton>
                        }
                        <ActionButton tone="danger" onClick={() => remove(s.id)}>Delete</ActionButton>
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
