type Props = {
  voteCount: number
  hasVoted: boolean
  onVote: () => void
  size?: 'sm' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1.5 gap-0.5',
  lg: 'text-base px-4 py-2 gap-1',
}

const iconSize = { sm: 12, lg: 16 }

export function UpvoteButton({ voteCount, hasVoted, onVote, size = 'sm' }: Props) {
  return (
    <button
      onClick={onVote}
      aria-label="Upvote"
      aria-pressed={hasVoted}
      className={`flex flex-col items-center rounded-button border font-bold transition-colors ${sizeClasses[size]} ${
        hasVoted
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border text-foreground-muted hover:border-accent hover:text-accent'
      }`}
    >
      <svg
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden
      >
        <path d="M6 1L11 8H1L6 1Z" />
      </svg>
      <span>{voteCount}</span>
    </button>
  )
}
