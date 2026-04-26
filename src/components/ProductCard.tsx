const PLACEHOLDER_COLORS = [
  '#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309', '#065F46',
]

function placeholderColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PLACEHOLDER_COLORS.length
  return PLACEHOLDER_COLORS[idx]
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

type Props = {
  product: Product
  onVote: (id: string) => void
}

export function ProductCard({ product, onVote }: Props) {
  return (
    <div className="bg-surface border border-border rounded-card px-4 py-4 flex gap-4 items-center hover:border-border-strong hover:shadow-md transition-all shadow-sm">
      {/* Upvote */}
      <button
        onClick={() => onVote(product.id)}
        aria-label="Upvote"
        aria-pressed={product.has_voted}
        className={`flex flex-col items-center gap-1 min-w-[48px] rounded-button border-2 px-2 py-2 transition-all flex-shrink-0 ${
          product.has_voted
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border text-foreground-muted hover:border-accent hover:text-accent'
        }`}
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor" aria-hidden>
          <path d="M6 0L12 10H0L6 0Z" />
        </svg>
        <span className="text-xs font-bold leading-none">{product.vote_count}</span>
      </button>

      {/* Logo */}
      {product.logo_url ? (
        <img
          src={product.logo_url}
          alt={product.name}
          className="w-12 h-12 rounded-card object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
          style={{ backgroundColor: placeholderColor(product.name) }}
        >
          {product.name[0]}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <a
          href={`/p/${product.slug}`}
          className="font-bold text-[15px] text-foreground hover:text-primary transition-colors"
        >
          {product.name}
        </a>
        <p className="text-sm text-foreground-muted mt-0.5 truncate">{product.tagline}</p>
        <p className="text-xs text-foreground-faint mt-1">by {product.maker.name}</p>
      </div>
    </div>
  )
}
