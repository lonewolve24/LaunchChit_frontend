import type { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'
import type { AdminUser } from '../lib/admin-auth'
import './styles/theme.css'

/*
  Admin layout shell. The wrapping `admin-scope` div triggers the CSS
  variable overrides defined in admin/styles/theme.css so every utility
  inside (bg-primary, text-foreground, …) renders with admin tokens
  without any Tailwind config rebuild.
*/
export function AdminLayout({ admin, children }: { admin: AdminUser; children: ReactNode }) {
  return (
    <div className="admin-scope min-h-screen bg-surface-subtle">
      <AdminTopbar admin={admin} />
      <div className="grid grid-cols-[224px_1fr] min-h-[calc(100vh-3.5rem)]">
        <aside className="border-r border-border">
          <AdminSidebar />
        </aside>
        <main className="p-6 lg:p-8 overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}
