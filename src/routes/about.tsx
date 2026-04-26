import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'

export const Route = createFileRoute('/about')({ component: AboutPage })

const stats = [
  { label: 'Products launched', value: '120+' },
  { label: 'Active makers', value: '85' },
  { label: 'Topics covered', value: '8' },
  { label: 'Built in', value: 'The Gambia' },
]

const values = [
  {
    title: 'Local first',
    body: 'We celebrate products built for the realities of the people who use them — mobile money for the daala, education tools that load on a 3G connection, health tools that account for actual pharmacy supply chains. Local depth before global ambition.',
  },
  {
    title: 'Open by default',
    body: 'We celebrate open conversations between makers and the community. Constructive feedback in public. No paywalls, no growth hacks dressed up as features.',
  },
  {
    title: 'Quality > volume',
    body: 'We curate. Real products only — no vapourware. If you can demo it on Tuesday, it can launch on Wednesday. Waitlists are for buyers who want to pay for a product that already exists, not for products that have not launched yet.',
  },
  {
    title: 'For builders, by builders',
    body: 'Founded by people shipping their own products. We dogfood every change. If something is annoying for us, we fix it.',
  },
]

const team = [
  {
    name: 'Momodou Lamin Jatta',
    role: 'Software Engineer',
    linkedin: 'https://linkedin.com/in/momodou-lamin-jatta',
    github: 'https://github.com/momodoulamin',
  },
  {
    name: 'Abdul Muizz Ikumapayi',
    role: 'Software Engineer',
    linkedin: 'https://linkedin.com/in/abdul-muizz-ikumapayi',
    github: 'https://github.com/abdulmuizz',
  },
  {
    name: 'Musa Jallow',
    role: 'Software Engineer',
    linkedin: 'https://linkedin.com/in/musa-jallow',
    github: 'https://github.com/musaajallo',
  },
]

const faqs = [
  {
    q: 'Who can submit a product?',
    a: 'Anyone building something real. We started in The Gambia and that community remains close to our hearts, but makers from anywhere are welcome — diaspora, regional, global. Just make sure your product solves a real problem for real people.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. Submitting and upvoting are free, forever. We may add optional paid features for makers later (e.g. enhanced analytics), but the core experience stays free.',
  },
  {
    q: 'How do you decide rankings?',
    a: 'Today\'s feed is sorted by upvotes from the last 24 hours. The leaderboard is sorted by all-time upvotes. Simple, transparent, no algorithmic boosting.',
  },
  {
    q: 'How do I get featured?',
    a: 'Ship something good and submit it. Tell your community. The best products rise — there\'s no application form.',
  },
  {
    q: 'Can I edit or remove my product?',
    a: 'Yes. From your profile, you can edit your product details or request removal at any time.',
  },
]

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {/* Hero */}
        <section className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">About LaunchedChit</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            A launch platform <br className="hidden md:block" />
            for builders
          </h1>
          <p className="text-lg text-foreground-muted mt-6 max-w-2xl mx-auto leading-relaxed">
            LaunchedChit is the place where makers ship their products and the community decides what's worth paying attention to. We started in The Gambia and we're proud of those roots — but the doors are open to builders everywhere. No follower counts, no algorithms, just work.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <a href="/submit" className="bg-accent text-white font-semibold text-sm px-6 py-3 rounded-button hover:bg-accent-dark transition-colors">
              Submit your product
            </a>
            <a href="/" className="text-sm font-semibold text-foreground border border-border px-6 py-3 rounded-button hover:border-border-strong transition-colors bg-surface">
              See launches
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface rounded-card p-6 text-center" style={{ boxShadow: cardShadow }}>
              <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-foreground-muted mt-1.5 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Story */}
        <section className="bg-surface rounded-card p-8 md:p-10 mb-16" style={{ boxShadow: cardShadow }}>
          <h2 className="text-2xl font-bold text-foreground mb-5">Why we built this</h2>
          <div className="space-y-4 text-foreground leading-relaxed">
            <p>
              For a long time, builders in The Gambia have shipped great products quietly — a mobile money tool here, a school management app there, a logistics platform for fish vendors at the Tanji landing site. The work was happening, but discovery was broken. You'd hear about a product two years after it launched, often by accident. The same story plays out across the region and beyond.
            </p>
            <p>
              LaunchedChit is our attempt to change that. A single, focused place where you submit what you're building, and the people who care most can find it on day one. The model is borrowed from Product Hunt, with a small-community twist: every launch should feel like it actually mattered to someone.
            </p>
            <p>
              We don't think every product needs to scale to a continent. Some of the best ones will only ever serve a few thousand people in one neighbourhood, town, or industry — and that's exactly the point.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">What we believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-surface rounded-card p-7" style={{ boxShadow: cardShadow }}>
                <h3 className="text-base font-bold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="bg-surface rounded-card p-8 md:p-10 mb-16" style={{ boxShadow: cardShadow }}>
          <h2 className="text-2xl font-bold text-foreground mb-2">The team</h2>
          <p className="text-foreground-muted mb-6">A small group of builders, working on this in our spare time.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {team.map((t) => (
              <div key={t.name} className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: '#1E293B' }}
                >
                  {t.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-foreground-muted">{t.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={t.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t.name} on LinkedIn`}
                      className="w-7 h-7 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-foreground-muted hover:text-primary hover:border-primary transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                    <a
                      href={t.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t.name} on GitHub`}
                      className="w-7 h-7 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-foreground-muted hover:text-primary hover:border-primary transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="bg-surface rounded-card p-5 group" style={{ boxShadow: cardShadow }}>
                <summary className="text-sm font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-foreground-faint group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-sm text-foreground-muted leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary rounded-card p-10 text-center" style={{ boxShadow: cardShadow }}>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to ship?</h2>
          <p className="text-white/70 mt-2 max-w-md mx-auto">
            Join 85+ makers using LaunchedChit to put their products in front of the community.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/submit" className="bg-accent text-white font-semibold text-sm px-6 py-3 rounded-button hover:bg-accent-dark transition-colors">
              Submit a product
            </a>
            <a href="/topics" className="text-sm font-semibold text-white border-2 border-white/40 px-6 py-3 rounded-button hover:border-white transition-colors">
              Browse topics
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
