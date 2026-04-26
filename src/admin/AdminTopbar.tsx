import { useState } from 'react'
import { clearAdmin, type AdminUser } from '../lib/admin-auth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function AdminTopbar({ admin }: { admin: AdminUser }) {
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await fetch(`${API}/admin/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => null)
    clearAdmin()
    window.location.href = '/admin/login'
  }

  return (
    <header className="bg-surface border-b border-border h-14 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <a href="/admin" className="font-bold text-foreground text-base tracking-tight">LaunchedChit <span className="text-primary">Admin</span></a>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{admin.role}</span>
      </div>

      <div className="flex items-center gap-3 flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-faint" aria-hidden>
            <circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search users, products, threads…"
            className="w-full text-sm bg-surface-subtle border border-border rounded-button pl-8 pr-3 py-1.5 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:bg-surface-subtle px-2 py-1 rounded-button cursor-pointer"
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-primary">{admin.name[0]}</span>
          <span className="hidden sm:inline">{admin.name}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-10 bg-surface rounded-card border border-border py-2 w-56 z-30" style={{ boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.18)' }}>
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-bold text-foreground truncate">{admin.name}</p>
              <p className="text-xs text-foreground-muted truncate">{admin.email}</p>
            </div>
            <a href="/" className="block px-4 py-2 text-sm text-foreground hover:bg-surface-subtle">Back to public site</a>
            <button type="button" onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-surface-subtle cursor-pointer">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
