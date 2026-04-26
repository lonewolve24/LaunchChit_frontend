type Props = {
  voteCount: number
  hasVoted: boolean
  onVote: () => void
  size?: 'sm' | 'lg'
}

export function UpvoteButton({ voteCount, hasVoted, onVote, size = 'sm' }: Props) {
  const isLg = size === 'lg'

  return (
    <button
      onClick={onVote}
      aria-label="Upvote"
      aria-pressed={hasVoted}
      className={`flex flex-col items-center rounded-button border-2 font-bold transition-all ${
        isLg ? 'text-base px-5 py-3 gap-1.5' : 'text-xs px-2 py-2 gap-1 min-w-[48px]'
      } ${
        hasVoted
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border text-foreground-muted hover:border-accent hover:text-accent'
      }`}
    >
      <svg
        width={isLg ? 14 : 12}
        height={isLg ? 12 : 10}
        viewBox="0 0 12 10"
        fill="currentColor"
        aria-hidden
      >
        <path d="M6 0L12 10H0L6 0Z" />
      </svg>
      <span className="leading-none">{voteCount}</span>
    </button>
  )
}
