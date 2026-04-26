import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { Toast } from './Toast'

afterEach(() => { vi.useRealTimers() })

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast message="Product submitted!" variant="success" onDismiss={vi.fn()} />)
    expect(screen.getByText('Product submitted!')).toBeInTheDocument()
  })

  it('renders success variant', () => {
    render(<Toast message="Done" variant="success" onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveClass('border-success')
  })

  it('renders error variant', () => {
    render(<Toast message="Failed" variant="error" onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveClass('border-destructive')
  })

  it('renders info variant', () => {
    render(<Toast message="Note" variant="info" onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveClass('border-primary')
  })

  it('calls onDismiss when close button is clicked', async () => {
    const onDismiss = vi.fn()
    render(<Toast message="Done" variant="success" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('auto-dismisses after 4 seconds', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast message="Done" variant="success" onDismiss={onDismiss} />)
    act(() => { vi.advanceTimersByTime(4000) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
