import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { SkeletonCard } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/archive')({
  validateSearch: (s: Record<string, unknown>) => ({ date: s.date as string | undefined }),
  component: ArchivePage,
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10)
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
}

export function ArchivePage() {
  const { date } = useSearch({ from: '/archive' })
  const navigate = useNavigate()

  const yesterday = toDateString(new Date(Date.now() - 86400000))
  const activeDate = date ?? yesterday

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/products/archive?date=${activeDate}`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeDate])

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

  function changeDate(d: string) {
    navigate({ to: '/archive', search: { date: d } })
  }

  const displayDate = new Date(activeDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Archive</h1>
            <p className="text-foreground-muted mt-1">Browse past launches — {displayDate}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(toDateString(new Date(new Date(activeDate + 'T00:00:00').getTime() - 86400000)))}
              className="px-3 py-2 bg-surface border border-border rounded-button text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
              style={{ boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)' }}
            >
              ← Prev
            </button>
            <input
              type="date"
              value={activeDate}
              max={toDateString(new Date())}
              onChange={(e) => changeDate(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-button text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)' }}
            />
            <button
              onClick={() => changeDate(toDateString(new Date(new Date(activeDate + 'T00:00:00').getTime() + 86400000)))}
              disabled={activeDate >= toDateString(new Date())}
              className="px-3 py-2 bg-surface border border-border rounded-button text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors disabled:opacity-40"
              style={{ boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)' }}
            >
              Next →
            </button>
          </div>
        </div>

        {loading ? (
          <SkeletonCard count={3} />
        ) : products.length === 0 ? (
          <EmptyState heading="No launches that day" body="Nothing was shipped on this date yet." cta={{ label: 'View launches', onClick: () => { window.location.href = '/' } }} />
        ) : (
          <div className="space-y-4">
            {products.map((p) => <ProductCard key={p.id} product={p} onVote={handleVote} />)}
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
