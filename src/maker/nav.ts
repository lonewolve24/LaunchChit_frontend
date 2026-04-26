/*
  Single source of truth for the maker dashboard sidebar.
  Add new sections / items here as Phase 2 and Phase 3 land.
  Phase-1 items only — dead links are deliberately omitted.
*/

export type MakerNavItem = {
  label: string
  to: string
  icon: 'home' | 'package' | 'plus' | 'comment' | 'users' | 'bell' | 'user' | 'settings'
}

export type MakerNavGroup = {
  label: string
  items: MakerNavItem[]
}

export const MAKER_NAV: MakerNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'home' },
    ],
  },
  {
    label: 'My Products',
    items: [
      { label: 'All products', to: '/dashboard/products', icon: 'package' },
      { label: 'Submit new', to: '/submit', icon: 'plus' },
    ],
  },
]
