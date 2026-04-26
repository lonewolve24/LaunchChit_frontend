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
      { label: 'Stories',   to: '/admin/stories',  icon: 'package' },
      { label: 'Topics',    to: '/admin/topics',   icon: 'package' },
      { label: 'Events',    to: '/admin/events',   icon: 'package' },
      { label: 'Featured',  to: '/admin/featured', icon: 'package' },
    ],
  },
  {
    label: 'Comms',
    items: [
      { label: 'Mailing list',  to: '/admin/mailing-list',   icon: 'mail' },
      { label: 'Broadcasts',    to: '/admin/broadcasts',     icon: 'mail' },
      { label: 'Notifications', to: '/admin/notifications',  icon: 'mail' },
      { label: 'Templates',     to: '/admin/templates',      icon: 'mail' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', to: '/admin/analytics', icon: 'chart' },
      { label: 'Flags',     to: '/admin/flags',     icon: 'flag' },
      { label: 'Health',    to: '/admin/health',    icon: 'cog' },
      { label: 'Settings',  to: '/admin/settings',  icon: 'settings' },
    ],
  },
]
