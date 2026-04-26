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

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'
const cardShadowHover = '0 8px 20px -4px rgb(0 0 0 / 0.12), 0 2px 6px -1px rgb(0 0 0 / 0.08)'

export function ProductCard({ product, onVote }: Props) {
  return (
    <div
      className="bg-surface rounded-card px-5 py-4 flex gap-5 items-center transition-shadow cursor-default"
      style={{ boxShadow: cardShadow }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = cardShadowHover }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = cardShadow }}
    >
      {/* Upvote */}
      <button
        onClick={() => onVote(product.id)}
        aria-label="Upvote"
        aria-pressed={product.has_voted}
        className={`flex flex-col items-center gap-1 w-12 rounded-button border-2 py-2 transition-all flex-shrink-0 ${
          product.has_voted
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border text-foreground-muted hover:border-accent hover:text-accent'
        }`}
      >
        <svg width="11" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden>
          <path d="M5.5 0L11 9H0L5.5 0Z" />
        </svg>
        <span className="text-xs font-bold leading-none">{product.vote_count}</span>
      </button>

      {/* Logo */}
      {product.logo_url ? (
        <img
          src={product.logo_url}
          alt={product.name}
          className="w-14 h-14 rounded-card object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-14 h-14 rounded-card flex items-center justify-center flex-shrink-0 text-white font-bold text-2xl"
          style={{ backgroundColor: placeholderColor(product.name) }}
        >
          {product.name[0]}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <a
          href={`/p/${product.slug}`}
          className="font-bold text-base text-foreground hover:text-primary transition-colors"
        >
          {product.name}
        </a>
        <p className="text-sm text-foreground-muted mt-0.5 truncate">{product.tagline}</p>
        <p className="text-xs text-foreground-faint mt-1.5">by {product.maker.name}</p>
      </div>
    </div>
  )
}
