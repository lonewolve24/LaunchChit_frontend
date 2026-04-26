import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { UpvoteButton } from './UpvoteButton'

describe('UpvoteButton', () => {
  it('renders the vote count', () => {
    render(<UpvoteButton voteCount={42} hasVoted={false} onVote={vi.fn()} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('calls onVote when clicked', async () => {
    const onVote = vi.fn()
    render(<UpvoteButton voteCount={10} hasVoted={false} onVote={onVote} />)
    await userEvent.click(screen.getByRole('button', { name: /upvote/i }))
    expect(onVote).toHaveBeenCalledOnce()
  })

  it('sets aria-pressed true when voted', () => {
    render(<UpvoteButton voteCount={10} hasVoted={true} onVote={vi.fn()} />)
    expect(screen.getByRole('button', { name: /upvote/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sets aria-pressed false when not voted', () => {
    render(<UpvoteButton voteCount={10} hasVoted={false} onVote={vi.fn()} />)
    expect(screen.getByRole('button', { name: /upvote/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('applies sm size classes', () => {
    render(<UpvoteButton voteCount={5} hasVoted={false} onVote={vi.fn()} size="sm" />)
    expect(screen.getByRole('button')).toHaveClass('text-xs')
  })

  it('applies lg size classes', () => {
    render(<UpvoteButton voteCount={5} hasVoted={false} onVote={vi.fn()} size="lg" />)
    expect(screen.getByRole('button')).toHaveClass('text-base')
  })
})
