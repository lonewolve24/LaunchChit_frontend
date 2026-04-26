type Props = {
  heading: string
  body?: string
  cta?: { label: string; onClick: () => void }
}

export function EmptyState({ heading, body, cta }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-raised mb-4" aria-hidden />
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {body && <p className="mt-2 text-sm text-foreground-muted max-w-xs">{body}</p>}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-5 bg-accent text-white text-sm font-semibold px-5 py-2 rounded-button hover:bg-accent-dark transition-colors"
        >
          {cta.label}
        </button>
      )}
    </div>
  )
}
