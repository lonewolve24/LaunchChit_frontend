import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Mention = {
  id: string
  context: 'thread' | 'comment' | 'request'
  source_title: string
  source_href: string
  excerpt: string
  actor: { name: string; username: string; avatar_color: string }
  created_at: string
}

const CONTEXT_LABEL: Record<Mention['context'], string> = {
  thread:  'Forum thread',
  comment: 'Product comment',
  request: 'Product request',
}

export const Route = createFileRoute('/dashboard/mentions')({ component: MentionsPage })

function MentionsPage() {
  const [items, setItems] = useState<Mention[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API}/me/mentions`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return
        setItems(body?.items ?? [])
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mentions</h1>
        <p className="text-foreground-muted mt-1">Where other Gambian builders have @-mentioned you across threads, comments, and product requests.</p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          heading="No mentions yet"
          body="When someone @-mentions you in a thread or product comment, it'll show up here."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
              <div className="flex items-start gap-3">
                <a href={`/profile/${m.actor.username}`} className="flex-shrink-0">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: m.actor.avatar_color }}>{m.actor.name[0]}</span>
                </a>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <a href={`/profile/${m.actor.username}`} className="text-sm font-bold text-foreground hover:text-primary">{m.actor.name}</a>
                      <span className="text-foreground-faint mx-1.5">·</span>
                      <span className="text-xs text-foreground-muted">{CONTEXT_LABEL[m.context]}</span>
                      <span className="text-foreground-faint mx-1.5">·</span>
                      <span className="text-xs text-foreground-faint">{m.created_at}</span>
                    </div>
                  </div>
                  <a href={m.source_href} className="text-sm font-bold text-foreground hover:text-primary mt-1 block truncate">{m.source_title}</a>
                  <p className="text-sm text-foreground-muted mt-1 leading-relaxed">{m.excerpt}</p>
                  <div className="mt-2">
                    <a href={m.source_href} className="text-xs font-semibold text-primary hover:underline">Reply →</a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
