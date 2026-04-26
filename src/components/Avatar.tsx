type Props = {
  name: string | null
  email: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
}

export function Avatar({ name, email, avatarUrl, size = 'md' }: Props) {
  const cls = `${sizeClasses[size]} rounded-full bg-primary flex items-center justify-center overflow-hidden`

  if (avatarUrl) {
    return (
      <div className={cls}>
        <img
          src={avatarUrl}
          alt={name ?? email}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={cls}>
      <span className="text-white font-bold">{initials(name, email)}</span>
    </div>
  )
}
