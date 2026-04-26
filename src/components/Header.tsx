import { useState, useRef, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type User = { name: string | null; email: string }

type Props = {
  user: User | null
}

function initials(user: User): string {
  if (user.name) {
    const parts = user.name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return user.email[0].toUpperCase()
}

const navLinks = [
  { label: 'Products', href: '/' },
  { label: 'Topics', href: '/topics' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Community', href: '/community' },
]

export function Header({ user }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }

  return (
    <header className="bg-primary sticky top-0 z-10" style={{ boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.25)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center gap-6">

        {/* Logo */}
        <a href="/" className="text-white font-bold text-xl tracking-tight flex-shrink-0">
          LaunchedChit
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-white/70 hover:text-white text-sm font-medium px-3 py-1.5 rounded-button transition-colors hover:bg-white/10"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <input
                autoFocus
                type="text"
                placeholder="Search products…"
                onBlur={() => setSearchOpen(false)}
                className="bg-white/10 text-white placeholder-white/40 text-sm rounded-button px-3 py-1.5 outline-none w-52 border border-white/20 focus:border-white/40 transition-all"
              />
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-white/60 hover:text-white transition-colors p-1.5 rounded-button hover:bg-white/10"
                aria-label="Search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            )}
          </div>

          {/* Submit */}
          <a
            href="/submit"
            className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-button hover:bg-accent-dark transition-colors flex-shrink-0"
          >
            Submit
          </a>

          {/* Auth state */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 focus:outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                aria-label="Account menu"
              >
                {initials(user)}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-11 bg-surface rounded-card py-1 w-48 z-50"
                  style={{ boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.18)' }}
                >
                  <a
                    href={`/profile/${user.name?.toLowerCase().replace(/\s+/g, '-') ?? 'me'}`}
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-surface-subtle transition-colors"
                  >
                    My profile
                  </a>
                  <a
                    href="/settings"
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-surface-subtle transition-colors"
                  >
                    Settings
                  </a>
                  <hr className="border-border my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-surface-subtle transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
