import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'

export const Route = createFileRoute('/terms')({ component: TermsPage })

export function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />
      <main className="max-w-2xl mx-auto px-6 lg:px-10 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>
        <div className="bg-surface rounded-card p-8 text-sm text-foreground leading-relaxed space-y-4" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
          <p>By using LaunchedChit you agree not to submit products that are harmful, illegal, or misleading. Products must be real and usable.</p>
          <p>We reserve the right to remove any product that violates these terms. Repeated violations may result in account suspension.</p>
          <p>These terms may change. We'll notify active users of significant changes.</p>
          <p className="text-foreground-muted">Last updated: April 2026</p>
        </div>
      </main>
    </div>
  )
}
