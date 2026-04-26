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
    body: 'Every product on LaunchedChit is built by Gambians, for Gambian problems. Mobile money for our daala. Education tools that work on a 3G connection. Health tools that account for our pharmacy supply chains.',
  },
  {
    title: 'Open by default',
    body: 'We celebrate open conversations between makers and the community. Constructive feedback in public. No paywalls, no growth hacks dressed up as features.',
  },
  {
    title: 'Quality > volume',
    body: 'We curate. Real products only — no waitlists, no vapourware. If you can demo it on Tuesday, it can launch on Wednesday.',
  },
  {
    title: 'For builders, by builders',
    body: 'Founded by people shipping their own products. We dogfood every change. If something is annoying for us, we fix it.',
  },
]

const team = [
  { name: 'Musa Jallow', role: 'Founder · Frontend' },
  { name: 'Momodou Jatta', role: 'Backend Engineer' },
  { name: 'Abdul Ikumpanyi', role: 'Auth & Security' },
]

const faqs = [
  {
    q: 'Who can submit a product?',
    a: 'Anyone building something for the Gambian market. You don\'t need to live in The Gambia — diaspora makers are welcome too. Just make sure your product solves a real problem here.',
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
      <Header user={null} />

      <main className="max-w-5xl mx-auto px-6 lg:px-10 py-12">
        {/* Hero */}
        <section className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">About LaunchedChit</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            A daily launch platform <br className="hidden md:block" />
            for Gambian builders 🇬🇲
          </h1>
          <p className="text-lg text-foreground-muted mt-6 max-w-2xl mx-auto leading-relaxed">
            LaunchedChit is the place where Gambian makers ship their products and the community decides what's worth paying attention to. No follower counts, no algorithms — just builders and their work.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <a href="/submit" className="bg-accent text-white font-semibold text-sm px-6 py-3 rounded-button hover:bg-accent-dark transition-colors">
              Submit your product
            </a>
            <a href="/" className="text-sm font-semibold text-foreground border border-border px-6 py-3 rounded-button hover:border-border-strong transition-colors bg-surface">
              See today's launches
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
              For a long time, builders in The Gambia have shipped great products quietly. A mobile money tool here, a school management app there, a logistics platform for fish vendors at the Tanji landing site. The work is happening — but discovery has been broken. You'd hear about a product two years after it launched, often by accident.
            </p>
            <p>
              LaunchedChit is our attempt to change that. A single, focused place where you submit what you're building, and the people who care most can find it on day one. The model is borrowed from Product Hunt, but the focus is unapologetically local: Gambian makers, Gambian problems, Gambian context.
            </p>
            <p>
              We don't think every product needs to scale to West Africa. Some of the best ones will only ever serve a few thousand people in Banjul or Basse — and that's exactly the point.
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
          <p className="text-foreground-muted mb-6">A small group of Gambian builders, working on this in our spare time.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {team.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: ['#1B4332', '#7C5CBF', '#2563EB'][i] }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-foreground-muted">{t.role}</p>
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
            Join 85+ Gambian makers using LaunchedChit to put their products in front of the community.
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
