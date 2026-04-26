import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders initials from full name', () => {
    render(<Avatar name="Musa Jallow" email="musa@example.com" />)
    expect(screen.getByText('MJ')).toBeInTheDocument()
  })

  it('renders single initial from single name', () => {
    render(<Avatar name="Musa" email="musa@example.com" />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('falls back to email initial when name is null', () => {
    render(<Avatar name={null} email="musa@example.com" />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('renders an img when avatar_url is provided', () => {
    render(<Avatar name="Musa Jallow" email="musa@example.com" avatarUrl="https://example.com/avatar.png" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
    expect(img).toHaveAttribute('alt', 'Musa Jallow')
  })

  it('applies sm size class', () => {
    render(<Avatar name="Musa Jallow" email="musa@example.com" size="sm" />)
    expect(screen.getByText('MJ').parentElement).toHaveClass('w-7')
  })

  it('applies md size class by default', () => {
    render(<Avatar name="Musa Jallow" email="musa@example.com" />)
    expect(screen.getByText('MJ').parentElement).toHaveClass('w-9')
  })
})
