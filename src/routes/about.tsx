import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'

export const Route = createFileRoute('/about')({ component: AboutPage })

export function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />
      <main className="max-w-2xl mx-auto px-6 lg:px-10 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-6">About LaunchedChit</h1>
        <div
          className="bg-surface rounded-card p-8 space-y-5 text-sm text-foreground leading-relaxed"
          style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}
        >
          <p>
            <strong>LaunchedChit</strong> is a daily feed of products built by Gambian makers. We believe the Gambia has a growing tech ecosystem that deserves its own launch platform — one that celebrates local innovation and connects builders with their community.
          </p>
          <p>
            Every day, makers can submit what they've built. The community upvotes the products they love. The top products rise to the top. Simple.
          </p>
          <p>
            Whether you've built a mobile payment app, a school management system, or a farming tool — if you built it and it helps people, we want it on LaunchedChit.
          </p>
          <p className="text-foreground-muted">
            Built in The Gambia 🇬🇲 · Questions? Reach us on Twitter.
          </p>
        </div>
      </main>
    </div>
  )
}
