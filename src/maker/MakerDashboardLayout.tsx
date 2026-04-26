import type { ReactNode } from 'react'
import { MakerSidebar } from './MakerSidebar'

/*
  Sub-shell rendered BELOW the public Header by /dashboard/route.tsx.
  Public Header keeps showing so users can fluidly switch between browsing
  and managing. Footer is hidden on /dashboard/* via __root.tsx.
*/
export function MakerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-subtle min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex gap-6">
        <MakerSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
