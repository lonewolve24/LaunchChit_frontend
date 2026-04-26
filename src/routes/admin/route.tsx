import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AdminLayout } from '../../admin/AdminLayout'
import { getAdmin, type AdminUser } from '../../lib/admin-auth'

/*
  /admin/* shell. The auth gate is enforced via beforeLoad — but we
  whitelist /admin/login and /admin/mfa(-enroll) so unauthenticated
  visitors can actually reach the login flow. The /admin/login page
  intentionally doesn't render the admin layout (it has its own marketing-
  style centered layout).
*/

const ADMIN_AUTH_PATHS = new Set(['/admin/login', '/admin/mfa', '/admin/mfa-enroll'])

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    if (ADMIN_AUTH_PATHS.has(location.pathname)) return
    const admin = await getAdmin()
    if (!admin) {
      throw redirect({ to: '/admin/login', search: { next: location.pathname } })
    }
  },
  component: AdminRouteShell,
})

function AdminRouteShell() {
  const { pathname } = useLocation()
  const [admin, setAdmin] = useState<AdminUser | null>(null)

  useEffect(() => {
    let cancelled = false
    getAdmin().then((a) => { if (!cancelled) setAdmin(a) })
    return () => { cancelled = true }
  }, [])

  // Auth-flow pages render bare (no sidebar / topbar)
  if (ADMIN_AUTH_PATHS.has(pathname)) {
    return <Outlet />
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-subtle text-sm text-foreground-muted">
        Loading admin…
      </div>
    )
  }

  return (
    <AdminLayout admin={admin}>
      <Outlet />
    </AdminLayout>
  )
}
