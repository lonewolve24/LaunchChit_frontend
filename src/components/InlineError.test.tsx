import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InlineError } from './InlineError'

describe('InlineError', () => {
  it('renders the error message', () => {
    render(<InlineError message="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('renders with an id for aria-describedby association', () => {
    render(<InlineError message="Email is required" id="email-error" />)
    expect(screen.getByText('Email is required')).toHaveAttribute('id', 'email-error')
  })

  it('renders nothing when message is null', () => {
    const { container } = render(<InlineError message={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('has role="alert" for screen readers', () => {
    render(<InlineError message="Something went wrong" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
