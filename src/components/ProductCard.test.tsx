import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProductCard } from './ProductCard'

const product = {
  id: 'prod-001',
  slug: 'farmlink-gm-a3k9z2',
  name: 'FarmLink GM',
  tagline: 'Connecting Gambian farmers to buyers directly',
  logo_url: null as string | null,
  vote_count: 24,
  has_voted: false,
  maker: { name: 'Musa Jallow' },
}

describe('ProductCard', () => {
  it('renders the product name as a link to its detail page', () => {
    render(<ProductCard product={product} onVote={vi.fn()} />)
    const link = screen.getByRole('link', { name: /farmlink gm/i })
    expect(link).toHaveAttribute('href', '/p/farmlink-gm-a3k9z2')
  })

  it('renders the tagline', () => {
    render(<ProductCard product={product} onVote={vi.fn()} />)
    expect(screen.getByText('Connecting Gambian farmers to buyers directly')).toBeInTheDocument()
  })

  it('renders the vote count', () => {
    render(<ProductCard product={product} onVote={vi.fn()} />)
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('renders the maker name', () => {
    render(<ProductCard product={product} onVote={vi.fn()} />)
    expect(screen.getByText(/musa jallow/i)).toBeInTheDocument()
  })

  it('calls onVote with product id when upvote button is clicked', async () => {
    const onVote = vi.fn()
    render(<ProductCard product={product} onVote={onVote} />)
    await userEvent.click(screen.getByRole('button', { name: /upvote/i }))
    expect(onVote).toHaveBeenCalledWith('prod-001')
  })

  it('shows voted state when has_voted is true', () => {
    render(<ProductCard product={{ ...product, has_voted: true }} onVote={vi.fn()} />)
    expect(screen.getByRole('button', { name: /upvote/i })).toHaveAttribute('aria-pressed', 'true')
  })
})
