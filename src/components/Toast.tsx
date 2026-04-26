import { useEffect } from 'react'

type Variant = 'success' | 'error' | 'info'

type Props = {
  message: string
  variant: Variant
  onDismiss: () => void
}

const variantClasses: Record<Variant, string> = {
  success: 'border-success text-success',
  error: 'border-destructive text-destructive',
  info: 'border-primary text-primary',
}

export function Toast({ message, variant, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 bg-surface border-l-4 rounded-card shadow-md px-4 py-3 text-sm font-medium ${variantClasses[variant]}`}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-foreground-faint hover:text-foreground transition-colors flex-shrink-0"
      >
        ✕
      </button>
    </div>
  )
}
