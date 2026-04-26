import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Filter = 'unread' | 'all'

type Notification = {
  id: string
  kind: 'comment' | 'upvote' | 'waitlist' | 'follow' | 'mention' | 'system'
  title: string
  body: string
  actor: { name: string; username: string; avatar_color: string } | null
  href: string
  created_at: string
  read: boolean
}

type Response = { items: Notification[]; counts: { all: number; unread: number } }

export const Route = createFileRoute('/dashboard/notifications')({
  component: NotificationsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (s.status === 'all' ? 'all' : 'unread') as Filter,
  }),
})

const KIND_ICON: Record<Notification['kind'], string> = {
  comment:  '💬',
  upvote:   '▲',
  waitlist: '👥',
  follow:   '＋',
  mention:  '@',
  system:   '◆',
}

function NotificationsPage() {
  const { status } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API}/me/notifications?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        if (cancelled) return
        setData(body ?? { items: [], counts: { all: 0, unread: 0 } })
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status])

  async function markRead(id: string) {
    const res = await fetch(`${API}/me/notifications/${id}/read`, { method: 'POST', credentials: 'include' })
    if (!res.ok) return
    setData((prev) => prev ? {
      items: status === 'unread' ? prev.items.filter((n) => n.id !== id) : prev.items.map((n) => n.id === id ? { ...n, read: true } : n),
      counts: { all: prev.counts.all, unread: Math.max(0, prev.counts.unread - 1) },
    } : prev)
  }

  async function markAllRead() {
    setBusy(true)
    const res = await fetch(`${API}/me/notifications/read-all`, { method: 'POST', credentials: 'include' })
    setBusy(false)
    if (!res.ok) { setToast({ message: 'Could not mark all as read.', variant: 'error' }); return }
    setData((prev) => prev ? {
      items: status === 'unread' ? [] : prev.items.map((n) => ({ ...n, read: true })),
      counts: { all: prev.counts.all, unread: 0 },
    } : prev)
    setToast({ message: 'All caught up.', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-foreground-muted mt-1">Comments, upvotes, waitlist signups, follows, and mentions.</p>
        </div>
        {data && data.counts.unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={busy}
            className="text-sm font-semibold px-4 py-2 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer disabled:opacity-60"
          >
            Mark all as read
          </button>
        )}
      </header>

      <div className="flex items-center gap-1 border-b border-border">
        {(['unread', 'all'] as Filter[]).map((f) => (
          <Link
            key={f}
            to="/dashboard/notifications"
            search={{ status: f }}
            className={`text-sm font-semibold capitalize px-3 py-2 -mb-px border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              status === f ? 'text-primary border-primary' : 'text-foreground-muted border-transparent hover:text-foreground'
            }`}
          >
            {f}
            {data && f === 'unread' && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status === f ? 'bg-primary/15 text-primary' : 'bg-surface-subtle text-foreground-muted'}`}>
                {data.counts.unread}
              </span>
            )}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          heading={status === 'unread' ? 'Inbox zero ✨' : 'No notifications yet'}
          body={status === 'unread' ? "You're all caught up." : 'Activity on your products will appear here.'}
        />
      ) : (
        <ul className="space-y-2">
          {data.items.map((n) => (
            <li key={n.id} className={`rounded-card overflow-hidden ${n.read ? 'bg-surface' : 'bg-primary/5 border border-primary/20'}`} style={{ boxShadow: n.read ? cardShadow : undefined }}>
              <a
                href={n.href}
                onClick={() => { if (!n.read) markRead(n.id) }}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-subtle/50 transition-colors"
              >
                {n.actor ? (
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: n.actor.avatar_color }}>{n.actor.name[0]}</span>
                ) : (
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 bg-surface-subtle text-foreground-muted" aria-hidden>{KIND_ICON[n.kind]}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                    <span className="text-xs text-foreground-faint flex-shrink-0">{n.created_at}</span>
                  </div>
                  <p className="text-sm text-foreground-muted mt-0.5 line-clamp-2">{n.body}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" aria-label="Unread" />}
              </a>
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
