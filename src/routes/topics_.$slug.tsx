import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { SkeletonCard } from '../components/Skeleton'
import { PageError } from '../components/PageError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/topics_/$slug')({ component: TopicFeedPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: { name: string }
}

function formatTopicName(slug: string) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function TopicFeedPage() {
  const { slug } = useParams({ from: '/topics_/$slug' })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/topics/${slug}/products`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setProducts(data); setLoading(false) } })
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

  const topicName = formatTopicName(slug)

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-center gap-3 mb-2">
          <a href="/topics" className="text-sm text-foreground-faint hover:text-foreground transition-colors">Topics</a>
          <span className="text-foreground-faint">›</span>
          <span className="text-sm text-foreground-muted">{topicName}</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{topicName}</h1>
            <p className="text-foreground-muted mt-1">Products tagged with {topicName}</p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0 space-y-4">
            {loading ? (
              <SkeletonCard count={3} />
            ) : (
              products.map((p) => <ProductCard key={p.id} product={p} onVote={handleVote} />)
            )}
          </div>

          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-surface rounded-card p-5" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
              <p className="text-sm font-bold text-foreground mb-3">Browse Topics</p>
              <div className="space-y-1">
                {['Fintech', 'Agri-Tech', 'EdTech', 'HealthTech', 'Logistics', 'E-commerce', 'Gov Tech', 'Social'].map((t) => (
                  <a
                    key={t}
                    href={`/topics/${t.toLowerCase().replace(/\s+/g, '-').replace('/', '-')}`}
                    className="block text-sm text-foreground-muted hover:text-foreground hover:bg-surface-subtle px-2 py-1.5 rounded-button transition-colors"
                  >
                    {t}
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
