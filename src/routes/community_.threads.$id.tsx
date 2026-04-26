import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { Skeleton } from '../components/Skeleton'
import { PageError } from '../components/PageError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/community_/threads/$id')({ component: ThreadDetailPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Reply = { id: string; author: { name: string }; body: string; created_at: string; upvotes: number }
type Thread = {
  id: string
  category: string
  product_slug: string | null
  title: string
  body: string
  author: { name: string; bio?: string }
  replies: number
  upvotes: number
  last_reply_at: string
  pinned: boolean
  follower_count: number
  reply_list: Reply[]
}

function avatarColor(name: string): string {
  const colors = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309']
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}

export function ThreadDetailPage() {
  const { id } = useParams({ from: '/community_/threads/$id' })
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [following, setFollowing] = useState(false)
  const [reply, setReply] = useState('')
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/community/threads/${id}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setThread(data); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [id])

  async function toggleFollow() {
    if (!thread) return
    if (following) {
      setFollowing(false)
      setThread({ ...thread, follower_count: thread.follower_count - 1 })
      setToast({ message: 'You\'ll stop receiving updates for this thread.', variant: 'success' })
      return
    }
    const res = await fetch(`${API}/community/threads/${thread.id}/follow`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setFollowing(true)
      setThread({ ...thread, follower_count: data.follower_count })
      setToast({ message: 'Following — you\'ll get notified of new replies.', variant: 'success' })
    }
  }

  function postReply() {
    if (!thread || !reply.trim()) return
    setReply('')
    setToast({ message: 'Sign in to post a reply.', variant: 'success' })
  }

  if (notFound) return <><Header /><PageError status={404} message="That thread does not exist." /></>

  if (loading || !thread) {
    return (
      <div className="min-h-screen bg-surface-subtle">
        <Header />
        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-4">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
        </main>
      </div>
    )
  }

  const categoryColor: Record<string, string> = {
    general: '#1B4332',
    'show-and-tell': '#7C5CBF',
    help: '#2563EB',
    feedback: '#DC4A22',
    jobs: '#0891B2',
    'off-topic': '#B45309',
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <a href="/community" className="text-foreground-faint hover:text-foreground transition-colors">Community</a>
          <span className="text-foreground-faint">›</span>
          <a href="/community?tab=forums" className="text-foreground-faint hover:text-foreground transition-colors">Forums</a>
          <span className="text-foreground-faint">›</span>
          <a href={`/community?tab=forums&category=${thread.category}`} className="text-foreground-faint hover:text-foreground transition-colors capitalize">
            {thread.category.replace(/-/g, ' ')}
          </a>
        </div>

        {/* Thread header */}
        <div className="bg-surface rounded-card p-6 md:p-8" style={{ boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {thread.pinned && (
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">📌 Pinned</span>
            )}
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ color: categoryColor[thread.category] ?? '#666', backgroundColor: `${categoryColor[thread.category] ?? '#666'}15` }}
            >
              {thread.category.replace(/-/g, ' ')}
            </span>
            {thread.product_slug && (
              <a
                href={`/p/${thread.product_slug}`}
                className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted hover:text-primary"
              >
                p/{thread.product_slug.split('-').slice(0, 2).join('-')}
              </a>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{thread.title}</h1>

          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: avatarColor(thread.author.name) }}
            >
              {thread.author.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{thread.author.name}</p>
              {thread.author.bio && <p className="text-xs text-foreground-muted">{thread.author.bio}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFollow}
                className={`text-sm font-semibold px-4 py-2 rounded-button transition-colors flex items-center gap-1.5 border ${
                  following ? 'bg-primary text-white border-primary' : 'bg-surface text-foreground border-border hover:border-border-strong'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={following ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <p className="text-xs text-foreground-faint mt-2">
            {thread.follower_count} followers · {thread.replies} replies · {thread.upvotes} upvotes
          </p>

          <hr className="border-border my-6" />

          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{thread.body}</div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-foreground-muted border border-border bg-surface px-4 py-1.5 rounded-button hover:border-accent hover:text-accent transition-colors">
              <svg width="11" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden><path d="M5.5 0L11 9H0L5.5 0Z" /></svg>
              Upvote · {thread.upvotes}
            </button>
            <button className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors">Share</button>
            <button className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors">Report</button>
          </div>
        </div>

        {/* Replies */}
        <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
          <h2 className="text-base font-bold text-foreground mb-5">{thread.replies} {thread.replies === 1 ? 'reply' : 'replies'}</h2>

          {/* Reply composer */}
          <div className="bg-surface-subtle rounded-card p-4 mb-6">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Add to the conversation…"
              rows={3}
              className="w-full bg-transparent text-sm text-foreground placeholder-foreground-faint resize-none outline-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-foreground-faint">Be kind. Be specific.</p>
              <button
                onClick={postReply}
                disabled={!reply.trim()}
                className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-button hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Post reply
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {thread.reply_list.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: avatarColor(r.author.name) }}
                >
                  {r.author.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{r.author.name}</span>
                    <span className="text-xs text-foreground-faint">· {r.created_at}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{r.body}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
                    <button className="hover:text-foreground transition-colors flex items-center gap-1">▲ Upvote ({r.upvotes})</button>
                    <button className="hover:text-foreground transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
