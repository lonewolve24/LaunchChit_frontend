/*
  Admin sidebar navigation — single source of truth.
  Only Phase-1 destinations are wired; placeholders for Phase 2-5
  are listed but pointed at /admin so they don't 404 yet.
*/

export type AdminNavIcon =
  | 'home'
  | 'package'
  | 'flag'
  | 'users'
  | 'shield'
  | 'comment'
  | 'mail'
  | 'chart'
  | 'settings'
  | 'cog'

export type AdminNavItem = {
  label: string
  to: string
  icon: AdminNavIcon
  /** Phase 2+ destinations may not yet exist; mark them so the sidebar
   *  can dim them without 404'ing. */
  upcoming?: boolean
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: 'home' },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { label: 'Submissions', to: '/admin/submissions', icon: 'package' },
      { label: 'Products',    to: '/admin/products',    icon: 'package' },
      { label: 'Reports',     to: '/admin/reports',     icon: 'flag' },
      { label: 'Comments',    to: '/admin/comments',    icon: 'comment' },
      { label: 'Threads',     to: '/admin/threads',     icon: 'comment' },
      { label: 'Requests',    to: '/admin/requests',    icon: 'comment' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Users',  to: '/admin/users',  icon: 'users' },
      { label: 'Makers', to: '/admin/makers', icon: 'users' },
      { label: 'Roles',  to: '/admin/roles',  icon: 'shield' },
    ],
  },
  {
    label: 'Editorial',
    items: [
      { label: 'Stories',   to: '/admin', icon: 'package', upcoming: true },
      { label: 'Topics',    to: '/admin', icon: 'package', upcoming: true },
      { label: 'Events',    to: '/admin', icon: 'package', upcoming: true },
      { label: 'Featured',  to: '/admin', icon: 'package', upcoming: true },
    ],
  },
  {
    label: 'Comms',
    items: [
      { label: 'Mailing list', to: '/admin', icon: 'mail', upcoming: true },
      { label: 'Broadcasts',   to: '/admin', icon: 'mail', upcoming: true },
      { label: 'Templates',    to: '/admin', icon: 'mail', upcoming: true },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', to: '/admin', icon: 'chart', upcoming: true },
      { label: 'Flags',     to: '/admin', icon: 'flag',  upcoming: true },
      { label: 'Health',    to: '/admin', icon: 'cog',   upcoming: true },
      { label: 'Settings',  to: '/admin', icon: 'settings', upcoming: true },
    ],
  },
]
