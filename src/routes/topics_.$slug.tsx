import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { SkeletonCard } from '../components/Skeleton'
import { Skeleton } from '../components/Skeleton'
import { PageError } from '../components/PageError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/topics_/$slug')({ component: TopicFeedPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Topic = {
  id: string
  slug: string
  name: string
  description: string
  product_count: number
}

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: { name: string }
  topics?: Array<{ slug: string; name: string }>
}

const TOPIC_COLOR = '#1E293B'

export function TopicFeedPage() {
  const { slug } = useParams({ from: '/topics_/$slug' })
  const [topic, setTopic] = useState<Topic | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API}/topics/${slug}`).then((r) => (r.status === 404 ? null : r.json())),
      fetch(`${API}/topics/${slug}/products`).then((r) => (r.status === 404 ? null : r.json())),
    ])
      .then(([topicData, productsData]) => {
        if (!topicData) { setNotFound(true); setLoading(false); return }
        setTopic(topicData)
        setProducts(productsData ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  async function handleVote(id: string) {
    const product = products.find((p) => p.id === id)
    if (!product) return
    const method = product.has_voted ? 'DELETE' : 'POST'
    const res = await fetch(`${API}/products/${id}/vote`, { method, credentials: 'include' })
    if (res.status === 401) { window.location.href = '/login'; return }
    if (res.ok) {
      const { vote_count } = await res.json()
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, vote_count, has_voted: !p.has_voted } : p))
    } else {
      setToast({ message: 'Could not register vote.', variant: 'error' })
    }
  }

  if (notFound) return <><Header user={null} /><PageError status={404} message="That topic does not exist." /></>

  const topicColor = TOPIC_COLOR

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <a href="/" className="text-foreground-faint hover:text-foreground transition-colors">Home</a>
          <span className="text-foreground-faint">›</span>
          <a href="/topics" className="text-foreground-faint hover:text-foreground transition-colors">Topics</a>
          <span className="text-foreground-faint">›</span>
          <span className="text-foreground-muted">{topic?.name ?? slug}</span>
        </div>

        {/* Topic header card */}
        {loading || !topic ? (
          <div className="bg-surface rounded-card p-8 mb-8" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
            <div className="flex items-center gap-5">
              <Skeleton className="w-16 h-16 rounded-card" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="bg-surface rounded-card p-8 mb-8 flex items-start gap-6"
            style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}
          >
            <div
              className="w-16 h-16 rounded-card flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
              style={{ backgroundColor: topicColor }}
            >
              {topic.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">{topic.name}</h1>
              <p className="text-foreground-muted mt-1.5 text-[15px]">{topic.description}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-foreground-faint">
                <span>{topic.product_count} {topic.product_count === 1 ? 'product' : 'products'}</span>
                <span>·</span>
                <span>Curated for Gambian builders</span>
              </div>
            </div>
          </div>
        )}

        {/* Products + sidebar */}
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground mb-4">Top products in {topic?.name ?? 'this topic'}</h2>
            <div className="space-y-4">
              {loading ? (
                <SkeletonCard count={3} />
              ) : products.length === 0 ? (
                <p className="text-sm text-foreground-muted">No products in this topic yet.</p>
              ) : (
                products.map((p) => <ProductCard key={p.id} product={p} onVote={handleVote} />)
              )}
            </div>
          </div>

          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-surface rounded-card p-5" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
              <p className="text-sm font-bold text-foreground mb-3">Browse Topics</p>
              <div className="space-y-1">
                {[
                  { name: 'Fintech', slug: 'fintech' },
                  { name: 'Agri-Tech', slug: 'agri-tech' },
                  { name: 'EdTech', slug: 'edtech' },
                  { name: 'HealthTech', slug: 'healthtech' },
                  { name: 'Logistics', slug: 'logistics' },
                  { name: 'E-commerce', slug: 'ecommerce' },
                  { name: 'Gov Tech', slug: 'govtech' },
                  { name: 'Social', slug: 'social' },
                ].map((t) => (
                  <a
                    key={t.slug}
                    href={`/topics/${t.slug}`}
                    className={`block text-sm px-2 py-1.5 rounded-button transition-colors ${
                      t.slug === slug
                        ? 'bg-primary text-white font-semibold'
                        : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                    }`}
                  >
                    {t.name}
                  </a>
                ))}
              </div>
            </div>
          </aside>
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
