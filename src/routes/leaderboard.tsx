import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { SkeletonCard } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/leaderboard')({ component: LeaderboardPage })

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

const PLACEHOLDER_COLORS = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309', '#065F46']
function placeholderColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PLACEHOLDER_COLORS.length
  return PLACEHOLDER_COLORS[idx]
}

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'

export function LeaderboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/products/leaderboard`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-foreground-muted mt-1">All-time top products by the Gambian builder community</p>
        </div>

        {loading ? (
          <SkeletonCard count={3} />
        ) : products.length === 0 ? (
          <EmptyState heading="No products yet" body="Be the first to launch something." cta={{ label: 'Submit your product', onClick: () => { window.location.href = '/submit' } }} />
        ) : (
          <div className="space-y-3">
            {products.map((product, i) => (
              <div key={product.id} className="flex items-center gap-4 bg-surface rounded-card px-5 py-4" style={{ boxShadow: cardShadow }}>
                <span className="text-2xl font-black text-foreground-faint w-8 text-center flex-shrink-0">
                  {i + 1}
                </span>

                <button
                  onClick={() => handleVote(product.id)}
                  aria-label="Upvote"
                  aria-pressed={product.has_voted}
                  className={`flex flex-col items-center gap-1 w-12 rounded-button border-2 py-2 transition-all flex-shrink-0 ${
                    product.has_voted ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden><path d="M5.5 0L11 9H0L5.5 0Z" /></svg>
                  <span className="text-xs font-bold leading-none">{product.vote_count}</span>
                </button>

                {product.logo_url ? (
                  <img src={product.logo_url} alt={product.name} className="w-12 h-12 rounded-card object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 text-white font-bold text-xl" style={{ backgroundColor: placeholderColor(product.name) }}>
                    {product.name[0]}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <a href={`/p/${product.slug}`} className="font-bold text-base text-foreground hover:text-primary transition-colors">
                    {product.name}
                  </a>
                  <p className="text-sm text-foreground-muted mt-0.5 truncate">{product.tagline}</p>
                  <p className="text-xs text-foreground-faint mt-1">by {product.maker.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
