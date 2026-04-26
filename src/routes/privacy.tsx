import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'

export const Route = createFileRoute('/privacy')({ component: PrivacyPage })

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />
      <main className="max-w-2xl mx-auto px-6 lg:px-10 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
        <div className="bg-surface rounded-card p-8 text-sm text-foreground leading-relaxed space-y-4" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
          <p>We collect your email address to send you a magic link for signing in. We do not sell your data. We do not track you across other websites.</p>
          <p>We store your submitted products and votes. You may request deletion of your account at any time by contacting us.</p>
          <p className="text-foreground-muted">Last updated: April 2026</p>
        </div>
      </main>
    </div>
  )
}
