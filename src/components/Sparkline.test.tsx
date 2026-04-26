import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('renders an empty state when given fewer than 2 points', () => {
    render(<Sparkline data={[{ date: '2026-04-01', value: 5 }]} />)
    expect(screen.getByText(/not enough data/i)).toBeInTheDocument()
  })

  it('renders an SVG with the given aria-label', () => {
    render(
      <Sparkline
        data={[
          { date: '2026-04-01', value: 5 },
          { date: '2026-04-02', value: 9 },
          { date: '2026-04-03', value: 7 },
        ]}
        ariaLabel="Upvotes last 7 days"
      />,
    )
    expect(screen.getByRole('img', { name: /upvotes last 7 days/i })).toBeInTheDocument()
  })
})
