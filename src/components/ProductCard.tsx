const PLACEHOLDER_COLORS = [
  '#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309', '#065F46',
]

function placeholderColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PLACEHOLDER_COLORS.length
  return PLACEHOLDER_COLORS[idx]
}

function formatLaunchDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Topic = { slug: string; name: string }
type Platform = 'web' | 'mobile' | 'desktop'

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: { name: string }
  topics?: Topic[]
  platforms?: Platform[]
  created_at?: string
  comments_count?: number
  waitlist_count?: number
}

function PlatformIcon({ kind }: { kind: Platform }) {
  const common = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  const label = kind === 'web' ? 'Web app' : kind === 'mobile' ? 'Mobile app' : 'Desktop app'
  const icon =
    kind === 'web' ? (
      <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
    ) : kind === 'mobile' ? (
      <svg {...common}><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
    ) : (
      <svg {...common}><rect width="20" height="14" x="2" y="3" rx="2" ry="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
    )
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-subtle border border-border text-foreground-muted"
      title={label}
      aria-label={label}
    >
      {icon}
    </span>
  )
}

type Props = {
  product: Product
  onVote?: (id: string) => void
  onWaitlist?: (id: string) => void
}

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'
const cardShadowHover = '0 8px 20px -4px rgb(0 0 0 / 0.12), 0 2px 6px -1px rgb(0 0 0 / 0.08)'

export function ProductCard({ product, onVote, onWaitlist }: Props) {
  return (
    <div
      className="bg-surface rounded-card px-5 py-4 flex gap-5 items-center transition-shadow"
      style={{ boxShadow: cardShadow }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = cardShadowHover }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = cardShadow }}
    >
      {/* Upvote */}
      <button
        onClick={() => onVote?.(product.id)}
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
        <div className="flex items-baseline gap-2 flex-wrap">
          <a
            href={`/p/${product.slug}`}
            className="font-bold text-base text-foreground hover:text-primary transition-colors"
          >
            {product.name}
          </a>
          {product.created_at && (
            <span className="text-xs text-foreground-faint">· launched {formatLaunchDate(product.created_at)}</span>
          )}
        </div>
        <p className="text-sm text-foreground-muted mt-0.5 truncate">{product.tagline}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-foreground-faint">by {product.maker.name}</span>
          {product.topics && product.topics.length > 0 && (
            <>
              <span className="text-foreground-faint text-xs">·</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {product.topics.map((topic) => (
                  <a
                    key={topic.slug}
                    href={`/topics/${topic.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-foreground-muted bg-surface-subtle hover:bg-primary hover:text-white px-2 py-0.5 rounded-full border border-border transition-colors"
                  >
                    {topic.name}
                  </a>
                ))}
              </div>
            </>
          )}
          {product.platforms && product.platforms.length > 0 && (
            <>
              <span className="text-foreground-faint text-xs">·</span>
              <div className="flex items-center gap-1">
                {product.platforms.map((p) => <PlatformIcon key={p} kind={p} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right-side stats: comments + waitlist */}
      <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
        <a
          href={`/p/${product.slug}#comments`}
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors px-2.5 py-1.5 rounded-button border border-border bg-surface min-w-[64px] justify-end"
          title={`${product.comments_count ?? 0} comments`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {product.comments_count ?? 0}
        </a>
        <button
          onClick={(e) => { e.preventDefault(); onWaitlist?.(product.id) }}
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-accent hover:border-accent transition-colors px-2.5 py-1.5 rounded-button border border-border bg-surface min-w-[64px] justify-end"
          title={`${product.waitlist_count ?? 0} on waitlist · join waitlist`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
          {product.waitlist_count ?? 0}
        </button>
      </div>
    </div>
  )
}
