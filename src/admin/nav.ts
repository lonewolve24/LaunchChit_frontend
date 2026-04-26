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
      { label: 'Submissions', to: '/admin', icon: 'package',  upcoming: true },
      { label: 'Reports',     to: '/admin', icon: 'flag',     upcoming: true },
      { label: 'Comments',    to: '/admin', icon: 'comment',  upcoming: true },
      { label: 'Threads',     to: '/admin', icon: 'comment',  upcoming: true },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Users',  to: '/admin', icon: 'users',  upcoming: true },
      { label: 'Makers', to: '/admin', icon: 'users',  upcoming: true },
      { label: 'Roles',  to: '/admin', icon: 'shield', upcoming: true },
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
