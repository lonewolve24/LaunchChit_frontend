import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'all' | 'upcoming' | 'past' | 'draft'

type Event = {
  id: string
  title: string
  start: string
  mode: string
  location: string
  attendees: number
  status: Exclude<Status, 'all'>
}

type Response = { items: Event[]; counts: { all: number; upcoming: number; past: number; draft: number } }

export const Route = createFileRoute('/admin/events')({
  component: AdminEventsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['all', 'upcoming', 'past', 'draft'].includes(String(s.status)) ? String(s.status) : 'all') as Status,
  }),
})

function AdminEventsPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [mode, setMode] = useState('In person')
  const [location, setLocation] = useState('')

  function load() {
    setLoading(true)
    fetch(`${API}/admin/events?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        setData(body ?? { items: [], counts: { all: 0, upcoming: 0, past: 0, draft: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [status])

  function setTab(s: string) {
    window.location.href = `/admin/events?status=${s}`
  }

  async function create() {
    if (!title.trim() || !start.trim()) { setToast({ message: 'Title and start time required.', variant: 'error' }); return }
    const res = await fetch(`${API}/admin/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: title.trim(), start, mode, location: location.trim() }),
    })
    if (!res.ok) { setToast({ message: 'Could not create event.', variant: 'error' }); return }
    setComposing(false); setTitle(''); setStart(''); setMode('In person'); setLocation('')
    setToast({ message: 'Draft event created.', variant: 'success' })
    load()
  }

  async function publish(id: string) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/events/${id}/publish`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Could not publish.', variant: 'error' }); return }
    setToast({ message: 'Event published.', variant: 'success' })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this event?')) return
    const res = await fetch(`${API}/admin/events/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { setToast({ message: 'Could not delete.', variant: 'error' }); return }
    setToast({ message: 'Deleted.', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events"
        subtitle="Meetups, demos, and online sessions for the Gambian builder community."
        right={<ActionButton tone="primary" onClick={() => setComposing((c) => !c)}>{composing ? 'Cancel' : '+ New event'}</ActionButton>}
      />

      {composing && (
        <AdminCard>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Banjul Builders Meetup #15" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Starts</label>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm bg-surface focus:outline-none focus:border-primary">
                <option>In person</option>
                <option>Online</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Address or Zoom link" />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <ActionButton tone="primary" onClick={create}>Create draft event</ActionButton>
            </div>
          </div>
        </AdminCard>
      )}

      <AdminTabs
        tabs={[
          { value: 'all',      label: 'All',      count: data?.counts.all },
          { value: 'upcoming', label: 'Upcoming', count: data?.counts.upcoming },
          { value: 'past',     label: 'Past',     count: data?.counts.past },
          { value: 'draft',    label: 'Drafts',   count: data?.counts.draft },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="No events" body="Add the first one above." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">Event</th>
                  <th className="font-semibold px-5 py-2.5">When</th>
                  <th className="font-semibold px-5 py-2.5">Mode</th>
                  <th className="font-semibold px-5 py-2.5">Attendees</th>
                  <th className="font-semibold px-5 py-2.5">Status</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5">
                      <p className="text-foreground font-medium">{e.title}</p>
                      <p className="text-xs text-foreground-faint truncate max-w-md">{e.location}</p>
                    </td>
                    <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">{new Date(e.start).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-5 py-2.5 text-foreground-muted">{e.mode}</td>
                    <td className="px-5 py-2.5 text-foreground">{e.attendees}</td>
                    <td className="px-5 py-2.5"><StatusBadge tone={e.status === 'upcoming' ? 'success' : e.status === 'past' ? 'neutral' : 'warn'}>{e.status}</StatusBadge></td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        {e.status === 'draft' && <ActionButton tone="primary" disabled={busyId === e.id} onClick={() => publish(e.id)}>Publish</ActionButton>}
                        <ActionButton tone="danger" onClick={() => remove(e.id)}>Delete</ActionButton>
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
