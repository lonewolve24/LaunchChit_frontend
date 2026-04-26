import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { EmptyState } from '../components/EmptyState'

export const Route = createFileRoute('/community')({ component: CommunityPage })

export function CommunityPage() {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />
      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-24">
        <EmptyState
          heading="Community is coming soon"
          body="Share ideas, ask questions, and connect with Gambian builders. We're building this next."
          cta={{ label: 'Submit a product for now', onClick: () => { window.location.href = '/submit' } }}
        />
      </main>
    </div>
  )
}
