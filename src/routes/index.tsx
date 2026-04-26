import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/')({ component: FeedPage })

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

export function FeedPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/products/today`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  async function handleVote(id: string) {
    const product = products.find((p) => p.id === id)
    if (!product) return

    const method = product.has_voted ? 'DELETE' : 'POST'
    const res = await fetch(`${API}/products/${id}/vote`, { method, credentials: 'include' })

    if (res.status === 401) {
      window.location.href = '/login'
      return
    }

    if (res.ok) {
      const { vote_count } = await res.json()
      setProducts((prev) =>
        prev.map((p) => p.id === id ? { ...p, vote_count, has_voted: !p.has_voted } : p)
      )
    } else {
      setToast({ message: 'Could not register vote. Try again.', variant: 'error' })
    }
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Today's Launches</h1>
          <span className="text-sm text-foreground-muted">{today}</span>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0 space-y-4">
            {loading ? (
              <SkeletonCard count={3} />
            ) : products.length === 0 ? (
              <EmptyState
                heading="No launches today"
                body="Be the first to ship something."
                cta={{ label: 'Submit your product', onClick: () => { window.location.href = '/submit' } }}
              />
            ) : (
              products.map((p) => (
                <ProductCard key={p.id} product={p} onVote={handleVote} />
              ))
            )}
          </div>

          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
            <div className="bg-surface rounded-card p-6" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
              <p className="text-base font-bold text-foreground mb-2">What is LaunchedChit?</p>
              <p className="text-sm text-foreground-muted leading-relaxed">
                A daily feed of products built by Gambian makers. Ship something. Get seen.
              </p>
              <a
                href="/submit"
                className="mt-5 block text-center bg-accent text-white text-sm font-semibold px-4 py-3 rounded-button hover:bg-accent-dark transition-colors"
              >
                Submit your product
              </a>
            </div>

            <div className="bg-surface rounded-card p-6" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
              <p className="text-base font-bold text-foreground mb-3">Popular Topics</p>
              <div className="space-y-1">
                {[
                  { label: 'Fintech', slug: 'fintech' },
                  { label: 'Agri-Tech', slug: 'agri-tech' },
                  { label: 'EdTech', slug: 'edtech' },
                  { label: 'HealthTech', slug: 'healthtech' },
                  { label: 'Logistics', slug: 'logistics' },
                  { label: 'E-commerce', slug: 'ecommerce' },
                ].map((t) => (
                  <a
                    key={t.slug}
                    href={`/topics/${t.slug}`}
                    className="flex items-center justify-between text-sm text-foreground-muted hover:text-foreground hover:bg-surface-subtle px-2 py-1.5 rounded-button transition-colors group"
                  >
                    <span>{t.label}</span>
                    <span className="text-foreground-faint group-hover:text-foreground-muted transition-colors">›</span>
                  </a>
                ))}
              </div>
              <a href="/topics" className="mt-3 block text-xs text-primary hover:underline font-medium">
                View all topics →
              </a>
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
