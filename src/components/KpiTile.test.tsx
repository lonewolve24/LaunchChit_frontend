import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiTile } from './KpiTile'

describe('KpiTile', () => {
  it('renders label and value', () => {
    render(<KpiTile label="Upvotes" value={123} />)
    expect(screen.getByText('Upvotes')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('shows positive delta with up arrow', () => {
    render(<KpiTile label="Upvotes" value={555} delta={12} />)
    expect(screen.getByText('↑')).toBeInTheDocument()
    expect(screen.getByText(/12/)).toBeInTheDocument()
  })

  it('shows negative delta with down arrow', () => {
    render(<KpiTile label="Views" value={50} delta={-7} />)
    expect(screen.getByText('↓')).toBeInTheDocument()
    expect(screen.getByText(/7/)).toBeInTheDocument()
  })

  it('shows hint without delta', () => {
    render(<KpiTile label="Subs" value={42} hint="Last 30 days" />)
    expect(screen.getByText('Last 30 days')).toBeInTheDocument()
  })
})
