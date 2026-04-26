import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the heading', () => {
    render(<EmptyState heading="No launches today" />)
    expect(screen.getByRole('heading', { name: /no launches today/i })).toBeInTheDocument()
  })

  it('renders optional body text', () => {
    render(<EmptyState heading="No launches today" body="Be the first to submit." />)
    expect(screen.getByText('Be the first to submit.')).toBeInTheDocument()
  })

  it('renders a CTA button when provided', () => {
    render(<EmptyState heading="No launches today" cta={{ label: 'Submit your product', onClick: vi.fn() }} />)
    expect(screen.getByRole('button', { name: /submit your product/i })).toBeInTheDocument()
  })

  it('calls cta.onClick when the button is clicked', async () => {
    const onClick = vi.fn()
    render(<EmptyState heading="No launches today" cta={{ label: 'Submit', onClick }} />)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders no button when cta is not provided', () => {
    render(<EmptyState heading="No launches today" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
