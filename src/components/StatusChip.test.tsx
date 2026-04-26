import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusChip } from './StatusChip'

describe('StatusChip', () => {
  it.each(['live', 'draft', 'in-review', 'removed', 'scheduled', 'archived'] as const)(
    'renders the %s label',
    (status) => {
      render(<StatusChip status={status} />)
      const label = status === 'in-review' ? 'In review' : status[0].toUpperCase() + status.slice(1)
      expect(screen.getByText(label)).toBeInTheDocument()
    },
  )
})
