import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Skeleton, SkeletonCard } from './Skeleton'

describe('Skeleton', () => {
  it('renders a single skeleton block with animate-pulse', () => {
    render(<Skeleton />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Skeleton className="h-4 w-32" />)
    const el = document.querySelector('.animate-pulse')
    expect(el).toHaveClass('h-4')
    expect(el).toHaveClass('w-32')
  })
})

describe('SkeletonCard', () => {
  it('renders the default count of 3 skeleton cards', () => {
    render(<SkeletonCard />)
    expect(screen.getAllByRole('presentation')).toHaveLength(3)
  })

  it('renders a custom count of skeleton cards', () => {
    render(<SkeletonCard count={5} />)
    expect(screen.getAllByRole('presentation')).toHaveLength(5)
  })
})
