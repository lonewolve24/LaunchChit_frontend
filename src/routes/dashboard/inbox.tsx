import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type CommentStatus = 'unread' | 'replied' | 'archived'
type Filter = CommentStatus | 'all'

type Comment = {
  id: string
  product_id: string
  product_slug: string
  product_name: string
  author: string
  author_username: string
  avatar_color: string
  body: string
  created_at: string
  status: CommentStatus
}

type InboxResponse = {
  items: Comment[]
  counts: { all: number; unread: number; replied: number; archived: number }
  products: Array<{ slug: string; name: string }>
}

export const Route = createFileRoute('/dashboard/inbox')({
  component: InboxPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: (['all', 'unread', 'replied', 'archived'].includes(String(s.status)) ? String(s.status) : 'unread') as Filter,
    product: typeof s.product === 'string' ? s.product : '',
  }),
})

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'unread',   label: 'Unread' },
  { value: 'replied',  label: 'Replied' },
  { value: 'archived', label: 'Archived' },
  { value: 'all',      label: 'All' },
]

function InboxPage() {
  const { status, product } = Route.useSearch()
  const [data, setData] = useState<InboxResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ status })
    if (product) params.set('product', product)
    fetch(`${API}/me/comments/inbox?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: InboxResponse | null) => {
        if (cancelled) return
        setData(body ?? { items: [], counts: { all: 0, unread: 0, replied: 0, archived: 0 }, products: [] })
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status, product])

  function openComment(id: string) {
    setOpenId((cur) => (cur === id ? null : id))
    setReply('')
  }

  async function postReply(id: string) {
    if (!reply.trim()) return
    setSubmitting(true)
    const res = await fetch(`${API}/me/comments/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ body: reply.trim() }),
    })
    setSubmitting(false)
    if (!res.ok) { setToast({ message: 'Could not send reply.', variant: 'error' }); return }
    setData((prev) => prev ? { ...prev, items: prev.items.map((c) => c.id === id ? { ...c, status: 'replied' } : c) } : prev)
    setReply('')
    setOpenId(null)
    setToast({ message: 'Reply sent.', variant: 'success' })
  }

  async function archive(id: string) {
    const res = await fetch(`${API}/me/comments/${id}/archive`, { method: 'POST', credentials: 'include' })
    if (!res.ok) { setToast({ message: 'Could not archive.', variant: 'error' }); return }
    setData((prev) => prev ? { ...prev, items: prev.items.map((c) => c.id === id ? { ...c, status: 'archived' } : c) } : prev)
    setToast({ message: 'Archived.', variant: 'success' })
  }

  async function unarchive(id: string) {
    const res = await fetch(`${API}/me/comments/${id}/unarchive`, { method: 'POST', credentials: 'include' })
    if (!res.ok) { setToast({ message: 'Could not move back.', variant: 'error' }); return }
    setData((prev) => prev ? { ...prev, items: prev.items.map((c) => c.id === id ? { ...c, status: 'unread' } : c) } : prev)
    setToast({ message: 'Moved back to unread.', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Comment inbox</h1>
        <p className="text-foreground-muted mt-1">
          Replies and questions left on your products. Reply to keep the conversation going — fast responses earn loyalty.
        </p>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto -mx-1 px-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            to="/dashboard/inbox"
            search={{ status: f.value, product }}
            className={`text-sm font-semibold px-3 py-2 -mb-px border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
              status === f.value ? 'text-primary border-primary' : 'text-foreground-muted border-transparent hover:text-foreground'
            }`}
          >
            {f.label}
            {data && f.value !== 'all' && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status === f.value ? 'bg-primary/15 text-primary' : 'bg-surface-subtle text-foreground-muted'}`}>
                {data.counts[f.value]}
              </span>
            )}
          </Link>
        ))}
        {data && data.products.length > 0 && (
          <select
            value={product}
            onChange={(e) => { window.location.href = `/dashboard/inbox?status=${status}${e.target.value ? `&product=${e.target.value}` : ''}` }}
            className="ml-auto text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary"
          >
            <option value="">All products</option>
            {data.products.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          heading={status === 'unread' ? 'Inbox zero ✨' : 'Nothing here'}
          body={status === 'unread'
            ? "You're caught up. New comments on your products will appear here."
            : 'No comments match this filter yet.'}
        />
      ) : (
        <ul className="space-y-3">
          {data.items.map((c) => {
            const isOpen = openId === c.id
            return (
              <li key={c.id} className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
                <div className="px-5 py-4 flex items-start gap-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: c.avatar_color }}>{c.author[0]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <a href={`/profile/${c.author_username}`} className="text-sm font-bold text-foreground hover:text-primary">{c.author}</a>
                        <span className="text-foreground-faint mx-1.5">·</span>
                        <a href={`/p/${c.product_slug}`} className="text-xs text-foreground-muted hover:text-primary">{c.product_name}</a>
                        <span className="text-foreground-faint mx-1.5">·</span>
                        <span className="text-xs text-foreground-faint">{c.created_at}</span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-foreground mt-1.5 leading-relaxed">{c.body}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      {c.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => openComment(c.id)}
                          className="font-semibold text-primary hover:underline cursor-pointer"
                        >
                          {isOpen ? 'Cancel' : c.status === 'replied' ? 'Reply again' : 'Reply'}
                        </button>
                      )}
                      {c.status === 'archived' ? (
                        <button type="button" onClick={() => unarchive(c.id)} className="font-semibold text-foreground-muted hover:text-foreground cursor-pointer">
                          Move to unread
                        </button>
                      ) : (
                        <button type="button" onClick={() => archive(c.id)} className="font-semibold text-foreground-muted hover:text-foreground cursor-pointer">
                          Archive
                        </button>
                      )}
                      <a href={`/p/${c.product_slug}#comments`} className="font-semibold text-foreground-muted hover:text-foreground">View on page</a>
                    </div>
                  </div>
                </div>

                {isOpen && c.status !== 'archived' && (
                  <div className="px-5 pb-5 pt-0 border-t border-border bg-surface-subtle">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder={`Reply to ${c.author}…`}
                      className="mt-3 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary bg-surface resize-y"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" onClick={() => { setOpenId(null); setReply('') }} className="text-sm font-semibold px-4 py-2 rounded-button text-foreground-muted hover:text-foreground cursor-pointer">
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => postReply(c.id)}
                        disabled={submitting || !reply.trim()}
                        className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {submitting ? 'Sending…' : 'Send reply'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
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

function StatusBadge({ status }: { status: CommentStatus }) {
  const map: Record<CommentStatus, { label: string; cls: string }> = {
    unread:   { label: 'Unread',   cls: 'bg-primary/10 text-primary' },
    replied:  { label: 'Replied',  cls: 'bg-success/10 text-success' },
    archived: { label: 'Archived', cls: 'bg-surface-subtle text-foreground-faint border border-border' },
  }
  const m = map[status]
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>
}
