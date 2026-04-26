import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Skeleton } from '../components/Skeleton'
import { PageError } from '../components/PageError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/community/requests/$id')({ component: RequestDetailPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Status = 'open' | 'in-progress' | 'shipped'

type RequestDetail = {
  id: string
  title: string
  body: string
  requester: { name: string }
  requester_email: string | null
  requester_phones: string[]
  upvotes: number
  responses: number
  status: Status
  created_at: string
  audience: string | null
  pay_summary: {
    supporters: number
    gmd_avg: number
    usd_avg: number
    gmd_count: number
    usd_count: number
  } | null
  interested_makers: Array<{ name: string; username: string; avatar_color: string; note?: string }>
  responses_list: Array<{ id: string; author: string; avatar_color: string; body: string; created_at: string }>
  related: Array<{ id: string; title: string; upvotes: number; status: Status }>
}

const statusBadge: Record<Status, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'text-foreground-muted bg-surface-raised' },
  'in-progress': { label: 'Being built', cls: 'text-accent bg-accent/10' },
  shipped: { label: 'Shipped 🎉', cls: 'text-success bg-success/10' },
}

function avatarColor(name: string): string {
  const colors = ['#1E40AF', '#0891B2', '#2563EB', '#06B6D4', '#3B82F6', '#0E7490']
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}

export function RequestDetailPage() {
  const { id } = useParams({ from: '/community/requests/$id' })
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [hasInterested, setHasInterested] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/community/requests/${id}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setRequest(data); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [id])

  async function upvote() {
    if (hasVoted || !request) return
    const res = await fetch(`${API}/community/requests/${request.id}/upvote`, { method: 'POST' })
    if (res.ok) {
      const { upvotes } = await res.json()
      setRequest((r) => r ? { ...r, upvotes } : r)
      setHasVoted(true)
      setToast({ message: 'Upvoted — your interest signals to makers.', variant: 'success' })
    }
  }

  async function markInterested() {
    if (hasInterested || !request) return
    const res = await fetch(`${API}/community/requests/${request.id}/interested`, { method: 'POST' })
    if (res.ok) {
      const { responses } = await res.json()
      setRequest((r) => r ? { ...r, responses } : r)
      setHasInterested(true)
      setToast({ message: "You're now listed as an interested maker.", variant: 'success' })
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast({ message: 'Link copied.', variant: 'success' })
    } catch {
      setToast({ message: 'Could not copy link.', variant: 'error' })
    }
  }

  if (notFound) return <><Header /><PageError status={404} message="That request does not exist." /></>

  if (loading || !request) {
    return (
      <div className="min-h-screen bg-surface-subtle">
        <Header />
        <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10 space-y-4">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-44 w-full rounded-card" />
        </main>
      </div>
    )
  }

  const badge = statusBadge[request.status]

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />

      <main className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
        <a href="/community?tab=requests" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to product requests
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hero */}
            <div className="bg-surface rounded-card p-6 md:p-8" style={{ boxShadow: cardShadow }}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                <span className="text-xs text-foreground-faint">·</span>
                <span className="text-xs text-foreground-faint">{request.created_at}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{request.title}</h1>
              <p className="text-sm text-foreground leading-relaxed mt-4 whitespace-pre-line">{request.body}</p>

              {request.audience && (
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-xs font-bold text-foreground-faint uppercase tracking-wider mb-1.5">Who would use this</p>
                  <p className="text-sm text-foreground">{request.audience}</p>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={upvote}
                  disabled={hasVoted}
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-button border-2 transition-colors ${hasVoted ? 'border-accent bg-accent/10 text-accent cursor-default' : 'border-border bg-surface text-foreground hover:border-accent hover:text-accent cursor-pointer'}`}
                >
                  <svg width="13" height="11" viewBox="0 0 11 9" fill="currentColor" aria-hidden><path d="M5.5 0L11 9H0L5.5 0Z" /></svg>
                  {hasVoted ? 'Upvoted' : 'I want this'}
                  <span className="text-foreground-faint font-normal">· {request.upvotes}</span>
                </button>
                {request.status !== 'shipped' && (
                  <button
                    type="button"
                    onClick={markInterested}
                    disabled={hasInterested}
                    className={`text-sm font-semibold px-4 py-2 rounded-button transition-colors ${hasInterested ? 'bg-primary/10 text-primary cursor-default' : 'bg-primary text-white hover:bg-primary-dark cursor-pointer'}`}
                  >
                    {hasInterested ? '✓ You\'re listed as interested' : "I'd build this"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyLink}
                  className="text-sm font-semibold px-4 py-2 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
                >
                  Share
                </button>
              </div>
            </div>

            {/* Interested makers */}
            <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">
                  {request.responses === 0 ? 'No makers interested yet' : `${request.responses} maker${request.responses === 1 ? '' : 's'} interested`}
                </h2>
                {request.responses > 0 && (
                  <span className="text-xs text-foreground-faint">Most-recent first</span>
                )}
              </div>

              {request.interested_makers.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  Be the first. If this matches your skills, click <em>I'd build this</em> above so the requester knows.
                </p>
              ) : (
                <ul className="space-y-3">
                  {request.interested_makers.map((m) => (
                    <li key={m.username} className="flex items-start gap-3">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: m.avatar_color }}>{m.name[0]}</span>
                      <div className="min-w-0 flex-1">
                        <a href={`/profile/${m.username}`} className="text-sm font-bold text-foreground hover:text-primary">{m.name}</a>
                        {m.note && <p className="text-sm text-foreground-muted mt-0.5">{m.note}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Discussion */}
            <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
              <h2 className="text-base font-bold text-foreground mb-4">Discussion</h2>
              {request.responses_list.length === 0 ? (
                <p className="text-sm text-foreground-muted">No replies yet. Add the first one to get the conversation started.</p>
              ) : (
                <ul className="space-y-4">
                  {request.responses_list.map((c) => (
                    <li key={c.id} className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: c.avatar_color }}>{c.author[0]}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-foreground">{c.author}</span>
                          <span className="text-xs text-foreground-faint">{c.created_at}</span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5 leading-relaxed">{c.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Pay interest */}
            <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
              <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">Willingness to pay</p>
              {request.pay_summary === null || request.pay_summary.supporters === 0 ? (
                <p className="text-sm text-foreground-muted">No one has pledged yet. <a href="#" onClick={(e) => { e.preventDefault(); upvote() }} className="text-primary font-medium hover:underline">Be the first.</a></p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {request.pay_summary.supporters} <span className="text-base font-medium text-foreground-muted">{request.pay_summary.supporters === 1 ? 'supporter' : 'supporters'}</span>
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">would pay for this product.</p>
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    {request.pay_summary.gmd_count > 0 && (
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-foreground-muted">Avg pledge (GMD)</span>
                        <span className="font-bold text-foreground">D{request.pay_summary.gmd_avg.toLocaleString()}/mo</span>
                      </div>
                    )}
                    {request.pay_summary.usd_count > 0 && (
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-foreground-muted">Avg pledge (USD)</span>
                        <span className="font-bold text-foreground">${request.pay_summary.usd_avg.toLocaleString()}/mo</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Requester */}
            <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
              <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">Requested by</p>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: avatarColor(request.requester.name) }}>{request.requester.name[0]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{request.requester.name}</p>
                  <p className="text-xs text-foreground-faint">{request.created_at}</p>
                </div>
              </div>
              {(request.requester_email || request.requester_phones.length > 0) && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  {request.requester_email && (
                    <a
                      href={`mailto:${request.requester_email}?subject=${encodeURIComponent(`About: ${request.title}`)}`}
                      className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground-faint flex-shrink-0" aria-hidden>
                        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span className="truncate">{request.requester_email}</span>
                    </a>
                  )}
                  {request.requester_phones.map((p, i) => {
                    const intl = p.replace(/[^\d]/g, '')
                    return (
                      <div key={`${p}-${i}`} className="flex items-center gap-2 text-sm text-foreground">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground-faint flex-shrink-0" aria-hidden>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <a href={`tel:${p.replace(/\s+/g, '')}`} className="hover:text-primary truncate">{p}</a>
                        <a
                          href={`https://wa.me/${intl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs font-semibold text-primary hover:underline flex-shrink-0"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Related */}
            {request.related.length > 0 && (
              <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
                <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">More requests</p>
                <ul className="space-y-3">
                  {request.related.map((r) => (
                    <li key={r.id}>
                      <a href={`/community/requests/${r.id}`} className="block group">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary leading-snug">{r.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusBadge[r.status].cls}`}>{statusBadge[r.status].label}</span>
                          <span className="text-xs text-foreground-faint">{r.upvotes} want</span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
                <a href="/community?tab=requests" className="mt-4 block text-xs text-primary hover:underline font-medium">
                  View all requests →
                </a>
              </div>
            )}
          </aside>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
