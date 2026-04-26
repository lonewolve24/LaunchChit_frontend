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
    <header className="bg-surface border-b border-border sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <a
          href="/"
          className="text-primary font-bold text-lg tracking-tight"
        >
          LaunchedChit
        </a>

        <nav className="flex items-center gap-3">
          <a
            href="/submit"
            className="bg-accent text-white text-sm font-semibold px-4 py-1.5 rounded-button hover:bg-accent-dark transition-colors"
          >
            Submit
          </a>

          {user ? (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {initials(user)}
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              Sign in
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
