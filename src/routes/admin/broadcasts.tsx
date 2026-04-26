import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Status = 'all' | 'draft' | 'scheduled' | 'sent'

type Broadcast = {
  id: string
  subject: string
  body: string
  segment: string
  status: Exclude<Status, 'all'>
  created_at: string
  sent_at?: string
  recipients?: number
  open_rate?: number
}

type Response = { items: Broadcast[]; counts: { all: number; scheduled: number; sent: number; draft: number } }

export const Route = createFileRoute('/admin/broadcasts')({
  component: AdminBroadcastsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['all', 'draft', 'scheduled', 'sent'].includes(String(s.status)) ? String(s.status) : 'all') as Status,
  }),
})

const SEGMENTS = [
  { value: 'all-subscribers',   label: 'All subscribers' },
  { value: 'all-makers',        label: 'All makers' },
  { value: 'fintech-followers', label: 'Fintech topic followers' },
  { value: 'agritech-followers', label: 'Agri-Tech topic followers' },
]

function AdminBroadcastsPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const [composing, setComposing] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [segment, setSegment] = useState(SEGMENTS[0].value)

  function load() {
    setLoading(true)
    fetch(`${API}/admin/broadcasts?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: Response | null) => {
        setData(b ?? { items: [], counts: { all: 0, scheduled: 0, sent: 0, draft: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [status])

  function setTab(s: string) {
    window.location.href = `/admin/broadcasts?status=${s}`
  }

  async function create() {
    if (!subject.trim() || !body.trim()) { setToast({ message: 'Subject and body required.', variant: 'error' }); return }
    const res = await fetch(`${API}/admin/broadcasts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subject: subject.trim(), body: body.trim(), segment }),
    })
    if (!res.ok) { setToast({ message: 'Could not save draft.', variant: 'error' }); return }
    setComposing(false); setSubject(''); setBody(''); setSegment(SEGMENTS[0].value)
    setToast({ message: 'Draft saved.', variant: 'success' })
    load()
  }

  async function send(id: string) {
    if (!confirm('Send this broadcast now? This cannot be undone.')) return
    setBusyId(id)
    const res = await fetch(`${API}/admin/broadcasts/${id}/send`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Could not send.', variant: 'error' }); return }
    const b = await res.json().catch(() => ({}))
    setToast({ message: `Sent to ${b.recipients ?? 0} subscribers.`, variant: 'success' })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this broadcast?')) return
    const res = await fetch(`${API}/admin/broadcasts/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) { setToast({ message: 'Could not delete.', variant: 'error' }); return }
    setToast({ message: 'Deleted.', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Broadcasts"
        subtitle="One-off emails to a segment of subscribers. Drafts stay private until you hit Send."
        right={<ActionButton tone="primary" onClick={() => setComposing((c) => !c)}>{composing ? 'Cancel' : '+ New broadcast'}</ActionButton>}
      />

      {composing && (
        <AdminCard>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y" placeholder="Plain text. Markdown rendering ships in Phase 5." />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Segment</label>
                <select value={segment} onChange={(e) => setSegment(e.target.value)} className="mt-1 ml-2 border border-border rounded-input px-3 py-2 text-sm bg-surface focus:outline-none focus:border-primary">
                  {SEGMENTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>
              <ActionButton tone="primary" onClick={create}>Save draft</ActionButton>
            </div>
          </div>
        </AdminCard>
      )}

      <AdminTabs
        tabs={[
          { value: 'all',       label: 'All',       count: data?.counts.all },
          { value: 'scheduled', label: 'Scheduled', count: data?.counts.scheduled },
          { value: 'sent',      label: 'Sent',      count: data?.counts.sent },
          { value: 'draft',     label: 'Drafts',    count: data?.counts.draft },
        ]}
        value={status}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="Compose a broadcast above." />
      ) : (
        <ul className="space-y-3">
          {data.items.map((b) => (
            <li key={b.id}>
              <AdminCard>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-foreground">{b.subject}</h3>
                      <StatusBadge tone={b.status === 'sent' ? 'success' : b.status === 'scheduled' ? 'primary' : 'warn'}>{b.status}</StatusBadge>
                      <StatusBadge tone="neutral">{SEGMENTS.find((s) => s.value === b.segment)?.label ?? b.segment}</StatusBadge>
                    </div>
                    <p className="text-sm text-foreground-muted line-clamp-2 max-w-2xl">{b.body}</p>
                    <div className="text-xs text-foreground-faint mt-2 flex items-center gap-3 flex-wrap">
                      <span>created {b.created_at}</span>
                      {b.sent_at && <span>· sent {b.sent_at}</span>}
                      {typeof b.recipients === 'number' && <span>· {b.recipients.toLocaleString()} recipients</span>}
                      {typeof b.open_rate === 'number' && <span>· {(b.open_rate * 100).toFixed(0)}% opens</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(b.status === 'draft' || b.status === 'scheduled') && (
                      <ActionButton tone="primary" disabled={busyId === b.id} onClick={() => send(b.id)}>Send now</ActionButton>
                    )}
                    {b.status !== 'sent' && (
                      <ActionButton tone="danger" onClick={() => remove(b.id)}>Delete</ActionButton>
                    )}
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
