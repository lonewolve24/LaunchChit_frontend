import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { MakerDashboardLayout } from '../../maker/MakerDashboardLayout'
import { getMe } from '../../lib/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    const me = await getMe()
    if (!me) {
      throw redirect({
        to: '/login',
        search: { next: location.pathname + location.searchStr, error: undefined },
      })
    }
    return { me }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const { me } = Route.useRouteContext()
  return (
    <>
      <Header user={{ name: me.name, email: me.email }} />
      <MakerDashboardLayout>
        <Outlet />
      </MakerDashboardLayout>
    </>
  )
}
