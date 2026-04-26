import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PageError } from './PageError'

describe('PageError', () => {
  it('renders the 404 heading', () => {
    render(<PageError status={404} />)
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('renders the 500 heading', () => {
    render(<PageError status={500} />)
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
  })

  it('renders a link back to the feed', () => {
    render(<PageError status={404} />)
    const link = screen.getByRole('link', { name: /back to feed/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders a custom message when provided', () => {
    render(<PageError status={404} message="That product does not exist." />)
    expect(screen.getByText('That product does not exist.')).toBeInTheDocument()
  })
})
