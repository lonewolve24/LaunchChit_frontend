import { Outlet, createRootRoute, useLocation, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Footer } from '../components/Footer'
import { CookieBanner } from '../components/CookieBanner'
import { ScrollToTop } from '../components/ScrollToTop'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

const HIDE_FOOTER_ON = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-otp']

function RouteLoader() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' || s.isLoading })
  if (!isLoading) return null
  return (
    <>
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] overflow-hidden bg-transparent pointer-events-none"
      >
        <div className="h-full w-1/3 bg-accent route-loader-bar" />
      </div>
      <div role="status" aria-live="polite" className="sr-only">Loading page…</div>
    </>
  )
}

function RootComponent() {
  const { pathname } = useLocation()
  const hideFooter = HIDE_FOOTER_ON.includes(pathname)

  return (
    <div className="flex flex-col min-h-screen">
      <RouteLoader />
      <div className="flex-1">
        <Outlet />
      </div>
      {!hideFooter && <Footer />}
      <ScrollToTop />
      <CookieBanner />
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
      />
    </div>
  )
}
