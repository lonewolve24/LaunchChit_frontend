type User = { name: string | null; email: string }

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

export function Header({ user }: Props) {
  return (
    <header className="bg-primary sticky top-0 z-10" style={{ boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.25)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a
          href="/"
          className="text-white font-bold text-xl tracking-tight"
        >
          LaunchedChit
        </a>

        <nav className="flex items-center gap-4">
          <a
            href="/submit"
            className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-button hover:bg-accent-dark transition-colors"
          >
            Submit
          </a>

          {user ? (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {initials(user)}
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign in
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
