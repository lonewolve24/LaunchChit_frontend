import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'

export const Route = createFileRoute('/stories')({ component: StoriesPage })

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'

type Story = {
  slug: string
  title: string
  excerpt: string
  author: string
  author_role: string
  category: 'Founder Story' | 'Industry' | 'Field Notes' | 'Deep Dive'
  read_time: string
  published_at: string
  cover_color: string
}

const stories: Story[] = [
  {
    slug: 'farmlink-gm-from-prototype-to-3000-farmers',
    title: 'How FarmLink GM went from a paper notebook to 3,000 farmers in 14 months',
    excerpt: 'Aminata was scribbling cassava prices on a yellow legal pad in Brikama market. Today FarmLink reaches farmers in every region. Here is what changed and what almost killed the project twice.',
    author: 'Aminata Touray',
    author_role: 'Founder, FarmLink GM',
    category: 'Founder Story',
    read_time: '8 min read',
    published_at: '2026-04-22',
    cover_color: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
  },
  {
    slug: 'mobile-money-rails-gambia-2026',
    title: 'The state of mobile money rails in The Gambia, 2026',
    excerpt: 'Wave, Africell Money, QMoney, and the new GamPay sandbox. We mapped the fees, the API quality, and the settlement times so you do not have to. Spoiler: one rail is doing the others a favor.',
    author: 'Lamin Jobe',
    author_role: 'Editor, LaunchedChit',
    category: 'Industry',
    read_time: '12 min read',
    published_at: '2026-04-18',
    cover_color: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
  },
  {
    slug: 'shipping-on-3g-design-notes',
    title: 'Shipping on 3G: design notes from five Gambian apps that actually work offline',
    excerpt: 'Latency budgets, image strategy, and the unspoken rule that you never assume a sync will finish. Lessons from the apps Gambians actually keep installed.',
    author: 'Fatou Ceesay',
    author_role: 'Engineer, Kombo Health',
    category: 'Field Notes',
    read_time: '6 min read',
    published_at: '2026-04-12',
    cover_color: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
  },
  {
    slug: 'why-we-open-sourced-our-dispatch-engine',
    title: 'Why we open-sourced our dispatch engine after a year of keeping it secret',
    excerpt: 'The honest answer is that we were the only ones using it. The longer answer is more interesting — and it changed how we think about moats in a small market.',
    author: 'Ebrima Sanneh',
    author_role: 'Co-founder, Banjul Bites',
    category: 'Founder Story',
    read_time: '5 min read',
    published_at: '2026-04-05',
    cover_color: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  },
  {
    slug: 'gambia-edtech-landscape',
    title: 'The Gambian edtech landscape, mapped',
    excerpt: 'Twenty-three products, three categories, one quiet acquisition. We talked to founders, teachers, and ministry staff to put together the most complete picture yet.',
    author: 'Mariama Bah',
    author_role: 'Contributor',
    category: 'Industry',
    read_time: '15 min read',
    published_at: '2026-03-28',
    cover_color: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
  },
  {
    slug: 'first-100-users-without-paid-ads',
    title: 'How four Kombo founders got their first 100 users without spending on ads',
    excerpt: 'Four very different playbooks: a WhatsApp group, a chama meeting, a radio interview, and one extremely well-timed power outage. What worked and what was just luck.',
    author: 'Ousman Drammeh',
    author_role: 'Contributor',
    category: 'Field Notes',
    read_time: '7 min read',
    published_at: '2026-03-20',
    cover_color: 'linear-gradient(135deg, #0E7490 0%, #155E75 100%)',
  },
  {
    slug: 'building-with-gov-tech-deep-dive',
    title: 'A deep dive into building products that integrate with Gambian government services',
    excerpt: 'What it takes to actually plug into GRA, GPPA, and the new digital ID rollout. Three founders, two lawyers, and one very patient civil servant share what they learned.',
    author: 'Ndey Sosseh',
    author_role: 'Contributor',
    category: 'Deep Dive',
    read_time: '18 min read',
    published_at: '2026-03-10',
    cover_color: 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)',
  },
]

const categories = ['All', 'Founder Story', 'Industry', 'Field Notes', 'Deep Dive'] as const
type Category = (typeof categories)[number]

import { useState } from 'react'

function StoriesPage() {
  const [active, setActive] = useState<Category>('All')
  const filtered = active === 'All' ? stories : stories.filter((s) => s.category === active)
  const [featured, ...rest] = filtered

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Stories</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Notes from Gambian builders</h1>
          <p className="text-foreground-muted mt-2 max-w-2xl">
            Founder journeys, industry deep dives, and field notes from people shipping products in The Gambia.
            Honest writing, no growth-hack fluff.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-8 border-b border-border pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`text-sm font-semibold px-3 py-2 -mb-px border-b-2 transition-colors ${
                active === c
                  ? 'text-primary border-primary'
                  : 'text-foreground-muted border-transparent hover:text-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-surface rounded-card p-10 text-center text-foreground-muted" style={{ boxShadow: cardShadow }}>
            No stories in this category yet. Check back soon.
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <a
                href={`/stories/${featured.slug}`}
                className="block bg-surface rounded-card overflow-hidden mb-10 hover:-translate-y-0.5 transition-transform"
                style={{ boxShadow: cardShadow }}
              >
                <div
                  className="h-56 md:h-72 flex items-end p-6 md:p-10 text-white"
                  style={{ background: featured.cover_color }}
                >
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2.5 py-1 rounded-full mb-3">
                      {featured.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold leading-tight max-w-3xl">{featured.title}</h2>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-foreground-muted text-base md:text-lg max-w-3xl">{featured.excerpt}</p>
                  <div className="flex items-center gap-3 mt-5 text-sm">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      {featured.author.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{featured.author}</div>
                      <div className="text-xs text-foreground-faint">
                        {featured.author_role} · {featured.read_time} · {new Date(featured.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((s) => (
                <a
                  key={s.slug}
                  href={`/stories/${s.slug}`}
                  className="bg-surface rounded-card overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
                  style={{ boxShadow: cardShadow }}
                >
                  <div className="h-40 p-5 flex items-end text-white" style={{ background: s.cover_color }}>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
                      {s.category}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-foreground leading-snug mb-2">{s.title}</h3>
                    <p className="text-sm text-foreground-muted line-clamp-3 flex-1">{s.excerpt}</p>
                    <div className="flex items-center gap-2 mt-4 text-xs text-foreground-faint">
                      <span className="font-medium text-foreground-muted">{s.author}</span>
                      <span>·</span>
                      <span>{s.read_time}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
