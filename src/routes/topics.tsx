import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'

export const Route = createFileRoute('/topics')({ component: TopicsPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Topic = {
  id: string
  slug: string
  name: string
  description: string
  product_count: number
}

const TOPIC_COLORS = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309', '#065F46', '#9D174D']

export function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/topics`)
      .then((r) => r.json())
      .then((data) => { setTopics(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Browse Topics</h1>
          <p className="text-foreground-muted mt-1">Explore products by category</p>
        </div>

        {loading ? (
          <SkeletonCard count={3} />
        ) : topics.length === 0 ? (
          <EmptyState heading="No topics yet" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {topics.map((topic, i) => (
              <a
                key={topic.id}
                href={`/topics/${topic.slug}`}
                className="bg-surface rounded-card p-6 block hover:scale-[1.02] transition-all"
                style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)', textDecoration: 'none' }}
              >
                <div
                  className="w-12 h-12 rounded-card flex items-center justify-center mb-4 text-white text-xl font-bold"
                  style={{ backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }}
                >
                  {topic.name[0]}
                </div>
                <h2 className="text-base font-bold text-foreground">{topic.name}</h2>
                <p className="text-sm text-foreground-muted mt-1 leading-relaxed">{topic.description}</p>
                <p className="text-xs text-foreground-faint mt-3 font-medium">
                  {topic.product_count} {topic.product_count === 1 ? 'product' : 'products'}
                </p>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
