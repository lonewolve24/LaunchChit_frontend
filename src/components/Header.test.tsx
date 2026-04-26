import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Header } from './Header'

describe('Header', () => {
  it('renders the logo linking to /', () => {
    render(<Header user={null} />)
    const logo = screen.getByRole('link', { name: /launchedchit/i })
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders a Submit link', () => {
    render(<Header user={null} />)
    expect(screen.getByRole('link', { name: /submit/i })).toBeInTheDocument()
  })

  it('renders Sign in when logged out', () => {
    render(<Header user={null} />)
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })

  it('hides Sign in when logged in', () => {
    render(<Header user={{ name: 'Musa Jallow', email: 'musa@example.com' }} />)
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument()
  })

  it('renders avatar with user initials when logged in', () => {
    render(<Header user={{ name: 'Musa Jallow', email: 'musa@example.com' }} />)
    expect(screen.getByText('MJ')).toBeInTheDocument()
  })

  it('falls back to email initial when name is null', () => {
    render(<Header user={{ name: null, email: 'musa@example.com' }} />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })
})
